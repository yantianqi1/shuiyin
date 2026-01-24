import cv2
import numpy as np
from PIL import Image
import io


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
