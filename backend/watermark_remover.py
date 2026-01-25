import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import io
import os
import qrcode
from datetime import datetime


def remove_watermark_inpaint(image_bytes: bytes, mask_bytes: bytes) -> bytes:
    """
    使用 OpenCV inpaint 方法去除水印
    用户需要提供水印区域的遮罩
    """
    # 读取原图
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 读取遮罩
    mask_arr = np.frombuffer(mask_bytes, np.uint8)
    mask = cv2.imdecode(mask_arr, cv2.IMREAD_GRAYSCALE)

    # 确保遮罩尺寸与图片一致
    if mask.shape[:2] != img.shape[:2]:
        mask = cv2.resize(mask, (img.shape[1], img.shape[0]))

    # 使用 inpaint 去除水印
    result = cv2.inpaint(img, mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)

    # 编码为 PNG
    _, buffer = cv2.imencode('.png', result)
    return buffer.tobytes()


def remove_watermark_auto(image_bytes: bytes, threshold: int = 200,
                          min_area: int = 100, max_area: int = 50000) -> bytes:
    """
    自动检测并去除浅色/半透明水印
    适用于白色或浅色的文字水印
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 转换到灰度图
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 使用自适应阈值检测浅色区域（可能是水印）
    _, mask = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)

    # 形态学操作清理噪点
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    # 找到轮廓并过滤
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # 创建新的遮罩，只保留合适大小的区域
    final_mask = np.zeros_like(mask)
    for contour in contours:
        area = cv2.contourArea(contour)
        if min_area < area < max_area:
            cv2.drawContours(final_mask, [contour], -1, 255, -1)

    # 膨胀遮罩以覆盖水印边缘
    final_mask = cv2.dilate(final_mask, kernel, iterations=2)

    # 使用 inpaint 去除水印
    result = cv2.inpaint(img, final_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)

    _, buffer = cv2.imencode('.png', result)
    return buffer.tobytes()


def remove_watermark_color(image_bytes: bytes,
                           color_lower: tuple = (200, 200, 200),
                           color_upper: tuple = (255, 255, 255)) -> bytes:
    """
    根据颜色范围去除水印
    适用于特定颜色的水印
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 创建颜色范围遮罩
    lower = np.array(color_lower, dtype=np.uint8)
    upper = np.array(color_upper, dtype=np.uint8)
    mask = cv2.inRange(img, lower, upper)

    # 形态学操作
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.dilate(mask, kernel, iterations=1)

    # 使用 inpaint 去除
    result = cv2.inpaint(img, mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)

    _, buffer = cv2.imencode('.png', result)
    return buffer.tobytes()


def remove_watermark_region(image_bytes: bytes,
                            x: int, y: int,
                            width: int, height: int) -> bytes:
    """
    去除指定区域的水印
    用户指定矩形区域
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 创建遮罩
    mask = np.zeros(img.shape[:2], dtype=np.uint8)
    mask[y:y+height, x:x+width] = 255

    # 使用 inpaint 去除
    result = cv2.inpaint(img, mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)

    _, buffer = cv2.imencode('.png', result)
    return buffer.tobytes()


def remove_watermark_frequency(image_bytes: bytes) -> bytes:
    """
    使用频域滤波去除重复性水印
    适用于周期性平铺的水印
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 分离通道处理
    channels = cv2.split(img)
    result_channels = []

    for channel in channels:
        # 转换到频域
        dft = cv2.dft(np.float32(channel), flags=cv2.DFT_COMPLEX_OUTPUT)
        dft_shift = np.fft.fftshift(dft)

        # 创建高通滤波器（去除低频周期性噪声）
        rows, cols = channel.shape
        crow, ccol = rows // 2, cols // 2

        # 创建带通滤波器
        mask = np.ones((rows, cols, 2), np.float32)

        # 在频域中心附近（除了中心点）应用衰减
        # 这有助于去除周期性水印
        r = 30  # 滤波器半径
        for i in range(-r, r):
            for j in range(-r, r):
                if i*i + j*j > 5*5 and i*i + j*j < r*r:
                    mask[crow+i, ccol+j] = 0.5

        # 应用滤波器
        fshift = dft_shift * mask

        # 逆变换
        f_ishift = np.fft.ifftshift(fshift)
        img_back = cv2.idft(f_ishift)
        img_back = cv2.magnitude(img_back[:,:,0], img_back[:,:,1])

        # 归一化
        img_back = cv2.normalize(img_back, None, 0, 255, cv2.NORM_MINMAX)
        result_channels.append(img_back.astype(np.uint8))

    # 合并通道
    result = cv2.merge(result_channels)

    _, buffer = cv2.imencode('.png', result)
    return buffer.tobytes()


def hex_to_rgb(hex_color: str) -> tuple:
    """将十六进制颜色转换为 RGB 元组"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def calculate_position(img_width: int, img_height: int,
                       wm_width: int, wm_height: int,
                       position: str, margin: int = 20,
                       custom_x: int = 0, custom_y: int = 0) -> tuple:
    """计算水印位置"""
    if position == 'top-left':
        return (margin, margin)
    elif position == 'top-right':
        return (img_width - wm_width - margin, margin)
    elif position == 'bottom-left':
        return (margin, img_height - wm_height - margin)
    elif position == 'bottom-right':
        return (img_width - wm_width - margin, img_height - wm_height - margin)
    elif position == 'center':
        return ((img_width - wm_width) // 2, (img_height - wm_height) // 2)
    elif position == 'custom':
        return (custom_x, custom_y)
    else:
        return (margin, margin)


def add_text_watermark(image_bytes: bytes, text: str,
                       font_size: int = 36, font_color: str = '#FFFFFF',
                       opacity: float = 0.5, rotation: float = 0,
                       position: str = 'bottom-right', margin: int = 20,
                       custom_x: int = 0, custom_y: int = 0) -> bytes:
    """
    添加文字水印
    """
    # 打开原始图片
    img = Image.open(io.BytesIO(image_bytes)).convert('RGBA')
    img_width, img_height = img.size

    # 创建透明图层用于绘制水印
    txt_layer = Image.new('RGBA', img.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(txt_layer)

    # 尝试加载中文字体
    font = None
    font_paths = [
        '/System/Library/Fonts/PingFang.ttc',  # macOS
        '/System/Library/Fonts/STHeiti Light.ttc',  # macOS
        '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',  # Linux
        '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf',  # Linux
        'C:/Windows/Fonts/msyh.ttc',  # Windows
        'C:/Windows/Fonts/simhei.ttf',  # Windows
    ]

    for font_path in font_paths:
        if os.path.exists(font_path):
            try:
                font = ImageFont.truetype(font_path, font_size)
                break
            except Exception:
                continue

    if font is None:
        try:
            font = ImageFont.truetype('arial.ttf', font_size)
        except Exception:
            font = ImageFont.load_default()

    # 获取文字大小
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # 转换颜色
    rgb = hex_to_rgb(font_color)
    alpha = int(255 * opacity)
    color = (*rgb, alpha)

    if position == 'tile':
        # 平铺模式
        spacing_x = text_width + 100
        spacing_y = text_height + 80

        for y in range(-img_height, img_height * 2, spacing_y):
            for x in range(-img_width, img_width * 2, spacing_x):
                # 创建临时图层用于旋转
                temp_layer = Image.new('RGBA', (text_width + 40, text_height + 40), (255, 255, 255, 0))
                temp_draw = ImageDraw.Draw(temp_layer)
                temp_draw.text((20, 20), text, font=font, fill=color)

                if rotation != 0:
                    temp_layer = temp_layer.rotate(rotation, expand=True, resample=Image.BICUBIC)

                # 粘贴到主图层
                paste_x = x
                paste_y = y
                if 0 <= paste_x < img_width and 0 <= paste_y < img_height:
                    txt_layer.paste(temp_layer, (paste_x, paste_y), temp_layer)
    else:
        # 单个水印
        x, y = calculate_position(img_width, img_height, text_width, text_height,
                                   position, margin, custom_x, custom_y)

        if rotation != 0:
            # 创建临时图层用于旋转
            temp_layer = Image.new('RGBA', (text_width + 40, text_height + 40), (255, 255, 255, 0))
            temp_draw = ImageDraw.Draw(temp_layer)
            temp_draw.text((20, 20), text, font=font, fill=color)
            temp_layer = temp_layer.rotate(rotation, expand=True, resample=Image.BICUBIC)

            # 重新计算位置
            new_width, new_height = temp_layer.size
            x, y = calculate_position(img_width, img_height, new_width, new_height,
                                       position, margin, custom_x, custom_y)
            txt_layer.paste(temp_layer, (x, y), temp_layer)
        else:
            draw.text((x, y), text, font=font, fill=color)

    # 合并图层
    result = Image.alpha_composite(img, txt_layer)

    # 转换为 RGB 并保存
    result_rgb = result.convert('RGB')
    output = io.BytesIO()
    result_rgb.save(output, format='PNG')
    return output.getvalue()


def add_image_watermark(image_bytes: bytes, watermark_bytes: bytes,
                        scale: float = 0.2, opacity: float = 0.5,
                        position: str = 'bottom-right', margin: int = 20,
                        custom_x: int = 0, custom_y: int = 0) -> bytes:
    """
    添加图片水印
    """
    # 打开原始图片和水印图片
    img = Image.open(io.BytesIO(image_bytes)).convert('RGBA')
    watermark = Image.open(io.BytesIO(watermark_bytes)).convert('RGBA')

    img_width, img_height = img.size

    # 缩放水印
    wm_width = int(img_width * scale)
    wm_height = int(watermark.height * (wm_width / watermark.width))
    watermark = watermark.resize((wm_width, wm_height), Image.LANCZOS)

    # 调整透明度
    if opacity < 1.0:
        # 获取 alpha 通道
        r, g, b, a = watermark.split()
        # 调整透明度
        a = a.point(lambda x: int(x * opacity))
        watermark = Image.merge('RGBA', (r, g, b, a))

    if position == 'tile':
        # 平铺模式
        result = img.copy()
        spacing_x = wm_width + 50
        spacing_y = wm_height + 50

        for y in range(0, img_height, spacing_y):
            for x in range(0, img_width, spacing_x):
                result.paste(watermark, (x, y), watermark)
    else:
        # 单个水印
        x, y = calculate_position(img_width, img_height, wm_width, wm_height,
                                   position, margin, custom_x, custom_y)
        result = img.copy()
        result.paste(watermark, (x, y), watermark)

    # 转换为 RGB 并保存
    result_rgb = result.convert('RGB')
    output = io.BytesIO()
    result_rgb.save(output, format='PNG')
    return output.getvalue()


def add_qrcode_watermark(image_bytes: bytes, url: str,
                         scale: float = 0.15, opacity: float = 0.8,
                         position: str = 'bottom-right', margin: int = 20,
                         custom_x: int = 0, custom_y: int = 0,
                         fill_color: str = '#000000',
                         back_color: str = '#FFFFFF') -> bytes:
    """
    添加二维码水印
    根据输入的URL生成二维码并添加为水印
    """
    # 打开原始图片
    img = Image.open(io.BytesIO(image_bytes)).convert('RGBA')
    img_width, img_height = img.size

    # 生成二维码
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)

    # 转换颜色
    fill_rgb = hex_to_rgb(fill_color)
    back_rgb = hex_to_rgb(back_color)

    qr_img = qr.make_image(fill_color=fill_rgb, back_color=back_rgb)
    qr_img = qr_img.convert('RGBA')

    # 缩放二维码
    qr_width = int(img_width * scale)
    qr_height = int(qr_img.height * (qr_width / qr_img.width))
    qr_img = qr_img.resize((qr_width, qr_height), Image.LANCZOS)

    # 调整透明度
    if opacity < 1.0:
        r, g, b, a = qr_img.split()
        a = a.point(lambda x: int(x * opacity))
        qr_img = Image.merge('RGBA', (r, g, b, a))

    if position == 'tile':
        # 平铺模式
        result = img.copy()
        spacing_x = qr_width + 80
        spacing_y = qr_height + 80

        for y in range(0, img_height, spacing_y):
            for x in range(0, img_width, spacing_x):
                result.paste(qr_img, (x, y), qr_img)
    else:
        # 单个水印
        x, y = calculate_position(img_width, img_height, qr_width, qr_height,
                                   position, margin, custom_x, custom_y)
        result = img.copy()
        result.paste(qr_img, (x, y), qr_img)

    # 转换为 RGB 并保存
    result_rgb = result.convert('RGB')
    output = io.BytesIO()
    result_rgb.save(output, format='PNG')
    return output.getvalue()


def add_datetime_watermark(image_bytes: bytes,
                           format_str: str = '%Y-%m-%d %H:%M:%S',
                           font_size: int = 36, font_color: str = '#FFFFFF',
                           opacity: float = 0.5, rotation: float = 0,
                           position: str = 'bottom-right', margin: int = 20,
                           custom_x: int = 0, custom_y: int = 0,
                           custom_text: str = '') -> bytes:
    """
    添加日期时间水印
    自动添加当前日期/时间戳，支持自定义格式
    """
    # 生成日期时间文字
    if custom_text:
        # 支持在自定义文字中嵌入日期时间
        text = datetime.now().strftime(custom_text)
    else:
        text = datetime.now().strftime(format_str)

    # 使用现有的文字水印函数
    return add_text_watermark(
        image_bytes, text,
        font_size=font_size, font_color=font_color,
        opacity=opacity, rotation=rotation,
        position=position, margin=margin,
        custom_x=custom_x, custom_y=custom_y
    )
