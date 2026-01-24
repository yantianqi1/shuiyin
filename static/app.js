document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const previewSection = document.getElementById('previewSection');
    const originalImage = document.getElementById('originalImage');
    const resultImage = document.getElementById('resultImage');
    const resultPlaceholder = document.getElementById('resultPlaceholder');
    const methodSelect = document.getElementById('methodSelect');
    const processBtn = document.getElementById('processBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    const loading = document.getElementById('loading');
    const threshold = document.getElementById('threshold');
    const thresholdValue = document.getElementById('thresholdValue');

    // 方式选项面板
    const autoOptions = document.getElementById('autoOptions');
    const regionOptions = document.getElementById('regionOptions');
    const colorOptions = document.getElementById('colorOptions');

    let currentFile = null;
    let resultBlob = null;

    // 区域选择相关
    let isDrawing = false;
    let startX, startY;
    const regionX = document.getElementById('regionX');
    const regionY = document.getElementById('regionY');
    const regionW = document.getElementById('regionW');
    const regionH = document.getElementById('regionH');

    // ============================================
    // 上传功能
    // ============================================

    // 点击上传区域
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });

    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            handleFile(files[0]);
        }
    });

    // 文件选择
    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        currentFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage.src = e.target.result;
            originalImage.onload = () => {
                setupRegionSelection();
            };

            // 平滑过渡动画
            uploadArea.parentElement.style.opacity = '0';
            uploadArea.parentElement.style.transform = 'translateY(-10px)';
            uploadArea.parentElement.style.transition = 'all 0.3s ease';

            setTimeout(() => {
                uploadArea.parentElement.style.display = 'none';
                previewSection.style.display = 'block';
                previewSection.style.opacity = '0';
                previewSection.style.transform = 'translateY(10px)';

                requestAnimationFrame(() => {
                    previewSection.style.transition = 'all 0.4s ease';
                    previewSection.style.opacity = '1';
                    previewSection.style.transform = 'translateY(0)';
                });
            }, 300);

            resultImage.style.display = 'none';
            resultPlaceholder.style.display = 'flex';
            downloadBtn.disabled = true;
            resultBlob = null;
        };
        reader.readAsDataURL(file);
    }

    // 设置区域选择功能
    function setupRegionSelection() {
        const wrapper = originalImage.parentElement;
        let canvas = document.getElementById('maskCanvas');

        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'maskCanvas';
            wrapper.appendChild(canvas);
        }

        canvas.width = originalImage.naturalWidth;
        canvas.height = originalImage.naturalHeight;
        canvas.style.width = originalImage.width + 'px';
        canvas.style.height = originalImage.height + 'px';

        if (methodSelect.value === 'region') {
            canvas.style.display = 'block';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '50%';
            canvas.style.transform = 'translateX(-50%)';
        } else {
            canvas.style.display = 'none';
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        canvas.onmousedown = (e) => {
            if (methodSelect.value !== 'region') return;
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            startX = (e.clientX - rect.left) * scaleX;
            startY = (e.clientY - rect.top) * scaleY;
        };

        canvas.onmousemove = (e) => {
            if (!isDrawing || methodSelect.value !== 'region') return;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const currentX = (e.clientX - rect.left) * scaleX;
            const currentY = (e.clientY - rect.top) * scaleY;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 绘制选择框
            ctx.strokeStyle = '#0D9488';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 4]);
            ctx.fillStyle = 'rgba(13, 148, 136, 0.15)';

            const width = currentX - startX;
            const height = currentY - startY;
            ctx.fillRect(startX, startY, width, height);
            ctx.strokeRect(startX, startY, width, height);

            // 绘制角标记
            ctx.setLineDash([]);
            ctx.fillStyle = '#0D9488';
            const cornerSize = 10;

            // 四个角
            ctx.fillRect(startX - 2, startY - 2, cornerSize, 3);
            ctx.fillRect(startX - 2, startY - 2, 3, cornerSize);

            ctx.fillRect(startX + width - cornerSize + 2, startY - 2, cornerSize, 3);
            ctx.fillRect(startX + width - 1, startY - 2, 3, cornerSize);

            ctx.fillRect(startX - 2, startY + height - 1, cornerSize, 3);
            ctx.fillRect(startX - 2, startY + height - cornerSize + 2, 3, cornerSize);

            ctx.fillRect(startX + width - cornerSize + 2, startY + height - 1, cornerSize, 3);
            ctx.fillRect(startX + width - 1, startY + height - cornerSize + 2, 3, cornerSize);

            // 更新输入框
            regionX.value = Math.round(Math.min(startX, currentX));
            regionY.value = Math.round(Math.min(startY, currentY));
            regionW.value = Math.round(Math.abs(width));
            regionH.value = Math.round(Math.abs(height));
        };

        canvas.onmouseup = () => {
            isDrawing = false;
        };

        canvas.onmouseleave = () => {
            isDrawing = false;
        };
    }

    // 方式选择切换
    methodSelect.addEventListener('change', () => {
        // 隐藏所有选项
        autoOptions.style.display = 'none';
        regionOptions.style.display = 'none';
        colorOptions.style.display = 'none';

        // 显示对应选项
        switch (methodSelect.value) {
            case 'auto':
                autoOptions.style.display = 'block';
                break;
            case 'region':
                regionOptions.style.display = 'block';
                break;
            case 'color':
                colorOptions.style.display = 'block';
                break;
        }

        setupRegionSelection();
    });

    // 阈值滑块
    threshold.addEventListener('input', () => {
        thresholdValue.textContent = threshold.value;
    });

    // 处理按钮
    processBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        loading.style.display = 'flex';

        const formData = new FormData();
        formData.append('image', currentFile);
        formData.append('method', methodSelect.value);

        switch (methodSelect.value) {
            case 'auto':
                formData.append('threshold', threshold.value);
                break;
            case 'region':
                formData.append('x', regionX.value);
                formData.append('y', regionY.value);
                formData.append('width', regionW.value);
                formData.append('height', regionH.value);
                break;
            case 'color':
                const lowerColor = document.getElementById('colorLower').value;
                const upperColor = document.getElementById('colorUpper').value;
                formData.append('color_lower', lowerColor);
                formData.append('color_upper', upperColor);
                break;
        }

        try {
            const response = await fetch('/api/remove-watermark', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('处理失败');
            }

            resultBlob = await response.blob();
            const url = URL.createObjectURL(resultBlob);
            resultImage.src = url;
            resultImage.style.display = 'block';
            resultPlaceholder.style.display = 'none';
            downloadBtn.disabled = false;

            // 成功效果
            const resultBox = document.querySelector('.result-box');
            resultBox.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.3)';
            setTimeout(() => {
                resultBox.style.boxShadow = '';
            }, 1000);

        } catch (error) {
            showAlert('处理失败：' + error.message);
        } finally {
            loading.style.display = 'none';
        }
    });

    // 提示框
    function showAlert(message) {
        const alertBox = document.createElement('div');
        alertBox.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            ">
                <div style="
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    padding: 32px 40px;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                    text-align: center;
                    max-width: 400px;
                ">
                    <svg style="width: 48px; height: 48px; color: #F97316; margin-bottom: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p style="color: #134E4A; font-size: 1rem; margin-bottom: 24px; line-height: 1.6;">${message}</p>
                    <button style="
                        font-family: inherit;
                        font-size: 0.95rem;
                        font-weight: 600;
                        padding: 12px 32px;
                        background: linear-gradient(135deg, #0D9488 0%, #14B8A6 100%);
                        color: white;
                        border: none;
                        border-radius: 9999px;
                        cursor: pointer;
                        box-shadow: 0 4px 15px rgba(13, 148, 136, 0.4);
                    ">确定</button>
                </div>
            </div>
        `;

        document.body.appendChild(alertBox);

        alertBox.querySelector('button').addEventListener('click', () => {
            alertBox.remove();
        });

        alertBox.addEventListener('click', (e) => {
            if (e.target === alertBox.firstElementChild) {
                alertBox.remove();
            }
        });
    }

    // 下载按钮
    downloadBtn.addEventListener('click', () => {
        if (!resultBlob) return;

        const url = URL.createObjectURL(resultBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'watermark_removed_' + currentFile.name.replace(/\.[^/.]+$/, '') + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // 重置按钮
    resetBtn.addEventListener('click', () => {
        // 过渡动画
        previewSection.style.transition = 'all 0.3s ease';
        previewSection.style.opacity = '0';
        previewSection.style.transform = 'translateY(10px)';

        setTimeout(() => {
            currentFile = null;
            resultBlob = null;
            imageInput.value = '';
            previewSection.style.display = 'none';

            uploadArea.parentElement.style.display = 'block';
            uploadArea.parentElement.style.opacity = '0';
            uploadArea.parentElement.style.transform = 'translateY(-10px)';

            requestAnimationFrame(() => {
                uploadArea.parentElement.style.transition = 'all 0.3s ease';
                uploadArea.parentElement.style.opacity = '1';
                uploadArea.parentElement.style.transform = 'translateY(0)';
            });

            resultImage.src = '';
            originalImage.src = '';
            downloadBtn.disabled = true;
        }, 300);
    });
});
