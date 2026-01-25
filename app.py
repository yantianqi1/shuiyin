from flask import Flask, request, send_file, render_template
from flask_cors import CORS
import io
import os
import zipfile
from PIL import Image

from backend.watermark_remover import (
    remove_watermark_auto,
    remove_watermark_region,
    remove_watermark_color,
    remove_watermark_frequency,
    add_text_watermark,
    add_image_watermark
)

app = Flask(__name__)
CORS(app)

# 配置上传文件大小限制
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB


def hex_to_bgr(hex_color):
    """将十六进制颜色转换为 BGR 元组"""
    hex_color = hex_color.lstrip('#')
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    return (b, g, r)


def convert_image_format(image_bytes, output_format='png', quality=95):
    """转换图片格式和压缩质量"""
    img = Image.open(io.BytesIO(image_bytes))

    # 确保正确的模式
    if output_format.lower() == 'jpeg' or output_format.lower() == 'jpg':
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

    output = io.BytesIO()

    if output_format.lower() in ('jpeg', 'jpg'):
        img.save(output, format='JPEG', quality=quality, optimize=True)
    elif output_format.lower() == 'webp':
        img.save(output, format='WEBP', quality=quality)
    else:  # PNG
        if quality < 100:
            # PNG 使用 compress_level (0-9)
            compress_level = max(0, min(9, int((100 - quality) / 11)))
            img.save(output, format='PNG', compress_level=compress_level)
        else:
            img.save(output, format='PNG')

    return output.getvalue()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/remove-watermark', methods=['POST'])
def remove_watermark():
    if 'image' not in request.files:
        return {'error': '没有上传图片'}, 400

    file = request.files['image']
    if file.filename == '':
        return {'error': '没有选择文件'}, 400

    method = request.form.get('method', 'auto')
    image_bytes = file.read()

    try:
        if method == 'auto':
            threshold = int(request.form.get('threshold', 200))
            result_bytes = remove_watermark_auto(image_bytes, threshold=threshold)

        elif method == 'region':
            x = int(request.form.get('x', 0))
            y = int(request.form.get('y', 0))
            width = int(request.form.get('width', 100))
            height = int(request.form.get('height', 50))
            result_bytes = remove_watermark_region(image_bytes, x, y, width, height)

        elif method == 'color':
            color_lower = request.form.get('color_lower', '#c8c8c8')
            color_upper = request.form.get('color_upper', '#ffffff')
            lower_bgr = hex_to_bgr(color_lower)
            upper_bgr = hex_to_bgr(color_upper)
            result_bytes = remove_watermark_color(image_bytes, lower_bgr, upper_bgr)

        elif method == 'frequency':
            result_bytes = remove_watermark_frequency(image_bytes)

        else:
            return {'error': '未知的处理方式'}, 400

        # 格式转换和压缩
        output_format = request.form.get('format', 'png')
        quality = int(request.form.get('quality', 95))
        result_bytes = convert_image_format(result_bytes, output_format, quality)

        # 确定 mimetype 和文件名
        ext = output_format if output_format != 'jpeg' else 'jpg'
        mimetypes = {'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'webp': 'image/webp'}
        mimetype = mimetypes.get(output_format, 'image/png')

        return send_file(
            io.BytesIO(result_bytes),
            mimetype=mimetype,
            as_attachment=False,
            download_name=f'result.{ext}'
        )

    except Exception as e:
        return {'error': f'处理失败: {str(e)}'}, 500


@app.route('/api/batch-remove-watermark', methods=['POST'])
def batch_remove_watermark():
    """批量去水印处理"""
    if 'images' not in request.files:
        return {'error': '没有上传图片'}, 400

    files = request.files.getlist('images')
    if len(files) == 0:
        return {'error': '没有选择文件'}, 400

    method = request.form.get('method', 'auto')
    output_format = request.form.get('format', 'png')
    quality = int(request.form.get('quality', 95))

    # 创建 ZIP 文件
    zip_buffer = io.BytesIO()

    try:
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for i, file in enumerate(files):
                if file.filename == '':
                    continue

                image_bytes = file.read()

                # 处理图片
                if method == 'auto':
                    threshold = int(request.form.get('threshold', 200))
                    result_bytes = remove_watermark_auto(image_bytes, threshold=threshold)
                elif method == 'region':
                    # 手动区域模式
                    region_mode = request.form.get('region_mode', 'unified')
                    if region_mode == 'unified':
                        x = int(request.form.get('region_x', 0))
                        y = int(request.form.get('region_y', 0))
                        w = int(request.form.get('region_w', 100))
                        h = int(request.form.get('region_h', 50))
                    else:
                        # 逐张标记模式
                        import json
                        regions = json.loads(request.form.get('regions', '[]'))
                        if i < len(regions):
                            region = regions[i]
                            x = region.get('x', 0)
                            y = region.get('y', 0)
                            w = region.get('w', 100)
                            h = region.get('h', 50)
                        else:
                            x, y, w, h = 0, 0, 100, 50
                    result_bytes = remove_watermark_region(image_bytes, x, y, w, h)
                elif method == 'color':
                    color_lower = request.form.get('color_lower', '#c8c8c8')
                    color_upper = request.form.get('color_upper', '#ffffff')
                    lower_bgr = hex_to_bgr(color_lower)
                    upper_bgr = hex_to_bgr(color_upper)
                    result_bytes = remove_watermark_color(image_bytes, lower_bgr, upper_bgr)
                elif method == 'frequency':
                    result_bytes = remove_watermark_frequency(image_bytes)
                else:
                    result_bytes = remove_watermark_auto(image_bytes)

                # 格式转换
                result_bytes = convert_image_format(result_bytes, output_format, quality)

                # 生成文件名
                original_name = os.path.splitext(file.filename)[0]
                ext = output_format if output_format != 'jpeg' else 'jpg'
                new_filename = f"{original_name}_processed.{ext}"

                zip_file.writestr(new_filename, result_bytes)

        zip_buffer.seek(0)

        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name='watermark_removed.zip'
        )

    except Exception as e:
        return {'error': f'处理失败: {str(e)}'}, 500


@app.route('/api/batch-add-watermark', methods=['POST'])
def batch_add_watermark():
    """批量添加水印"""
    if 'images' not in request.files:
        return {'error': '没有上传图片'}, 400

    files = request.files.getlist('images')
    if len(files) == 0:
        return {'error': '没有选择文件'}, 400

    watermark_type = request.form.get('type', 'text')
    output_format = request.form.get('format', 'png')
    quality = int(request.form.get('quality', 95))

    # 通用参数
    position = request.form.get('position', 'bottom-right')
    opacity = float(request.form.get('opacity', 0.5))
    margin = int(request.form.get('margin', 20))
    custom_x = int(request.form.get('custom_x', 0))
    custom_y = int(request.form.get('custom_y', 0))

    # 获取水印图片（如果是图片水印）
    watermark_bytes = None
    if watermark_type == 'image':
        if 'watermark_image' not in request.files:
            return {'error': '请上传水印图片'}, 400
        watermark_file = request.files['watermark_image']
        if watermark_file.filename == '':
            return {'error': '请选择水印图片'}, 400
        watermark_bytes = watermark_file.read()

    # 创建 ZIP 文件
    zip_buffer = io.BytesIO()

    try:
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for i, file in enumerate(files):
                if file.filename == '':
                    continue

                image_bytes = file.read()

                if watermark_type == 'text':
                    text = request.form.get('text', '')
                    if not text:
                        return {'error': '请输入水印文字'}, 400

                    font_size = int(request.form.get('font_size', 36))
                    font_color = request.form.get('font_color', '#FFFFFF')
                    rotation = float(request.form.get('rotation', 0))

                    result_bytes = add_text_watermark(
                        image_bytes, text,
                        font_size=font_size, font_color=font_color,
                        opacity=opacity, rotation=rotation,
                        position=position, margin=margin,
                        custom_x=custom_x, custom_y=custom_y
                    )
                else:
                    scale = float(request.form.get('scale', 0.2))
                    result_bytes = add_image_watermark(
                        image_bytes, watermark_bytes,
                        scale=scale, opacity=opacity,
                        position=position, margin=margin,
                        custom_x=custom_x, custom_y=custom_y
                    )

                # 格式转换
                result_bytes = convert_image_format(result_bytes, output_format, quality)

                # 生成文件名
                original_name = os.path.splitext(file.filename)[0]
                ext = output_format if output_format != 'jpeg' else 'jpg'
                new_filename = f"{original_name}_watermarked.{ext}"

                zip_file.writestr(new_filename, result_bytes)

        zip_buffer.seek(0)

        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name='watermarked.zip'
        )

    except Exception as e:
        return {'error': f'处理失败: {str(e)}'}, 500


@app.route('/api/add-watermark', methods=['POST'])
def add_watermark():
    if 'image' not in request.files:
        return {'error': '没有上传图片'}, 400

    file = request.files['image']
    if file.filename == '':
        return {'error': '没有选择文件'}, 400

    watermark_type = request.form.get('type', 'text')
    image_bytes = file.read()

    # 通用参数
    position = request.form.get('position', 'bottom-right')
    opacity = float(request.form.get('opacity', 0.5))
    margin = int(request.form.get('margin', 20))
    custom_x = int(request.form.get('custom_x', 0))
    custom_y = int(request.form.get('custom_y', 0))

    try:
        if watermark_type == 'text':
            text = request.form.get('text', '')
            if not text:
                return {'error': '请输入水印文字'}, 400

            font_size = int(request.form.get('font_size', 36))
            font_color = request.form.get('font_color', '#FFFFFF')
            rotation = float(request.form.get('rotation', 0))

            result_bytes = add_text_watermark(
                image_bytes, text,
                font_size=font_size, font_color=font_color,
                opacity=opacity, rotation=rotation,
                position=position, margin=margin,
                custom_x=custom_x, custom_y=custom_y
            )

        elif watermark_type == 'image':
            if 'watermark_image' not in request.files:
                return {'error': '请上传水印图片'}, 400

            watermark_file = request.files['watermark_image']
            if watermark_file.filename == '':
                return {'error': '请选择水印图片'}, 400

            watermark_bytes = watermark_file.read()
            scale = float(request.form.get('scale', 0.2))

            result_bytes = add_image_watermark(
                image_bytes, watermark_bytes,
                scale=scale, opacity=opacity,
                position=position, margin=margin,
                custom_x=custom_x, custom_y=custom_y
            )

        else:
            return {'error': '未知的水印类型'}, 400

        # 格式转换和压缩
        output_format = request.form.get('format', 'png')
        quality = int(request.form.get('quality', 95))
        result_bytes = convert_image_format(result_bytes, output_format, quality)

        # 确定 mimetype 和文件名
        ext = output_format if output_format != 'jpeg' else 'jpg'
        mimetypes = {'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'webp': 'image/webp'}
        mimetype = mimetypes.get(output_format, 'image/png')

        return send_file(
            io.BytesIO(result_bytes),
            mimetype=mimetype,
            as_attachment=False,
            download_name=f'watermarked.{ext}'
        )

    except Exception as e:
        return {'error': f'处理失败: {str(e)}'}, 500


if __name__ == '__main__':
    # 确保 uploads 目录存在
    os.makedirs('uploads', exist_ok=True)
    app.run(debug=True, host='0.0.0.0', port=5001)
