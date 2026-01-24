from flask import Flask, request, send_file, render_template
from flask_cors import CORS
import io
import os

from backend.watermark_remover import (
    remove_watermark_auto,
    remove_watermark_region,
    remove_watermark_color,
    remove_watermark_frequency
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

        return send_file(
            io.BytesIO(result_bytes),
            mimetype='image/png',
            as_attachment=False,
            download_name='result.png'
        )

    except Exception as e:
        return {'error': f'处理失败: {str(e)}'}, 500


if __name__ == '__main__':
    # 确保 uploads 目录存在
    os.makedirs('uploads', exist_ok=True)
    app.run(debug=True, host='0.0.0.0', port=5001)
