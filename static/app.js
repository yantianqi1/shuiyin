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
    // 像素风格音效和动画效果
    // ============================================

    // 创建像素风格的点击反馈
    function createPixelBurst(x, y, color = '#5D9B47') {
        const burst = document.createElement('div');
        burst.className = 'pixel-burst';
        burst.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 8px;
            height: 8px;
            background: ${color};
            pointer-events: none;
            z-index: 9999;
            animation: pixelBurstAnim 0.4s steps(4) forwards;
        `;
        document.body.appendChild(burst);

        // 创建多个小方块
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            const angle = (i / 6) * Math.PI * 2;
            const distance = 20 + Math.random() * 20;
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: 4px;
                height: 4px;
                background: ${color};
                pointer-events: none;
                z-index: 9999;
                animation: particleFly 0.5s steps(5) forwards;
                --tx: ${Math.cos(angle) * distance}px;
                --ty: ${Math.sin(angle) * distance}px;
            `;
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 500);
        }

        setTimeout(() => burst.remove(), 400);
    }

    // 添加动态CSS动画
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes pixelBurstAnim {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(3); opacity: 0; }
        }
        @keyframes particleFly {
            0% { transform: translate(0, 0); opacity: 1; }
            100% { transform: translate(var(--tx), var(--ty)); opacity: 0; }
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
        }
        @keyframes successPulse {
            0% { box-shadow: 0 0 0 0 rgba(74, 237, 217, 0.7); }
            70% { box-shadow: 0 0 0 20px rgba(74, 237, 217, 0); }
            100% { box-shadow: 0 0 0 0 rgba(74, 237, 217, 0); }
        }
    `;
    document.head.appendChild(styleSheet);

    // 按钮点击效果
    function addButtonClickEffect(btn) {
        btn.addEventListener('click', () => {
            const rect = btn.getBoundingClientRect();
            createPixelBurst(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                btn.classList.contains('primary') ? '#5D9B47' :
                btn.classList.contains('download') ? '#4AEDD9' : '#7F7F7F'
            );
        });
    }

    // 为所有按钮添加效果
    document.querySelectorAll('.btn').forEach(addButtonClickEffect);

    // ============================================
    // 上传功能
    // ============================================

    // 点击上传区域
    uploadArea.addEventListener('click', (e) => {
        createPixelBurst(e.clientX, e.clientY, '#9C7A4A');
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
            createPixelBurst(e.clientX, e.clientY, '#4AEDD9');
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

            // 添加过渡动画
            uploadArea.parentElement.style.opacity = '0';
            uploadArea.parentElement.style.transform = 'translateY(-20px)';

            setTimeout(() => {
                uploadArea.parentElement.style.display = 'none';
                previewSection.style.display = 'block';
                previewSection.style.opacity = '0';
                previewSection.style.transform = 'translateY(20px)';

                setTimeout(() => {
                    previewSection.style.transition = 'all 0.3s ease';
                    previewSection.style.opacity = '1';
                    previewSection.style.transform = 'translateY(0)';
                }, 50);
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

            // 像素风格选择框
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 4;
            ctx.setLineDash([8, 4]);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';

            const width = currentX - startX;
            const height = currentY - startY;
            ctx.fillRect(startX, startY, width, height);
            ctx.strokeRect(startX, startY, width, height);

            // 绘制角标记
            const cornerSize = 12;
            ctx.setLineDash([]);
            ctx.fillStyle = '#FF0000';

            // 四个角的小方块
            ctx.fillRect(startX - 2, startY - 2, cornerSize, 4);
            ctx.fillRect(startX - 2, startY - 2, 4, cornerSize);

            ctx.fillRect(startX + width - cornerSize + 2, startY - 2, cornerSize, 4);
            ctx.fillRect(startX + width - 2, startY - 2, 4, cornerSize);

            ctx.fillRect(startX - 2, startY + height - 2, cornerSize, 4);
            ctx.fillRect(startX - 2, startY + height - cornerSize + 2, 4, cornerSize);

            ctx.fillRect(startX + width - cornerSize + 2, startY + height - 2, cornerSize, 4);
            ctx.fillRect(startX + width - 2, startY + height - cornerSize + 2, 4, cornerSize);

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
        // 添加切换动画
        const currentOptions = document.querySelector('.method-options:not([style*="display: none"])');
        if (currentOptions) {
            currentOptions.style.opacity = '0';
            currentOptions.style.transform = 'translateX(-10px)';
        }

        setTimeout(() => {
            autoOptions.style.display = 'none';
            regionOptions.style.display = 'none';
            colorOptions.style.display = 'none';

            let targetOptions = null;
            switch (methodSelect.value) {
                case 'auto':
                    targetOptions = autoOptions;
                    break;
                case 'region':
                    targetOptions = regionOptions;
                    break;
                case 'color':
                    targetOptions = colorOptions;
                    break;
            }

            if (targetOptions) {
                targetOptions.style.display = 'block';
                targetOptions.style.opacity = '0';
                targetOptions.style.transform = 'translateX(10px)';

                setTimeout(() => {
                    targetOptions.style.transition = 'all 0.2s ease';
                    targetOptions.style.opacity = '1';
                    targetOptions.style.transform = 'translateX(0)';
                }, 50);
            }

            setupRegionSelection();
        }, 150);
    });

    // 阈值滑块
    threshold.addEventListener('input', () => {
        thresholdValue.textContent = threshold.value;
        // 添加数值变化动画
        thresholdValue.style.transform = 'scale(1.2)';
        setTimeout(() => {
            thresholdValue.style.transform = 'scale(1)';
        }, 100);
    });

    // 处理按钮
    processBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        loading.style.display = 'flex';

        // 更新加载文字动画
        const loadingTexts = ['施展魔法中', '处理像素中', '消除水印中', '合成图像中'];
        let textIndex = 0;
        const loadingTextEl = loading.querySelector('.loading-text');
        const textInterval = setInterval(() => {
            textIndex = (textIndex + 1) % loadingTexts.length;
            loadingTextEl.textContent = loadingTexts[textIndex] + '...';
        }, 800);

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

            // 成功动画效果
            const resultBox = document.querySelector('.result-box');
            resultBox.style.animation = 'successPulse 0.6s ease';
            setTimeout(() => {
                resultBox.style.animation = '';
            }, 600);

            // 在结果图片上创建粒子效果
            const imgRect = resultImage.getBoundingClientRect();
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    createPixelBurst(
                        imgRect.left + Math.random() * imgRect.width,
                        imgRect.top + Math.random() * imgRect.height,
                        ['#4AEDD9', '#17DD62', '#FCEE4B'][Math.floor(Math.random() * 3)]
                    );
                }, i * 100);
            }

        } catch (error) {
            // 错误抖动效果
            processBtn.style.animation = 'shake 0.3s ease';
            setTimeout(() => {
                processBtn.style.animation = '';
            }, 300);

            showPixelAlert('处理失败：' + error.message);
        } finally {
            clearInterval(textInterval);
            loading.style.display = 'none';
        }
    });

    // 像素风格的提示框
    function showPixelAlert(message) {
        const alertBox = document.createElement('div');
        alertBox.className = 'pixel-alert';
        alertBox.innerHTML = `
            <div class="pixel-alert-content">
                <span class="pixel-alert-icon">⚠️</span>
                <span class="pixel-alert-text">${message}</span>
                <button class="pixel-alert-btn">确定</button>
            </div>
        `;
        alertBox.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease;
        `;

        const content = alertBox.querySelector('.pixel-alert-content');
        content.style.cssText = `
            background: #C6C6C6;
            padding: 24px 32px;
            border: 4px solid #555555;
            box-shadow:
                inset 4px 4px 0 #FFFFFF,
                inset -4px -4px 0 #373737,
                8px 8px 0 rgba(0,0,0,0.5);
            text-align: center;
            font-family: 'Press Start 2P', cursive;
            font-size: 0.7em;
            max-width: 400px;
        `;

        const icon = alertBox.querySelector('.pixel-alert-icon');
        icon.style.cssText = `
            display: block;
            font-size: 2em;
            margin-bottom: 16px;
        `;

        const text = alertBox.querySelector('.pixel-alert-text');
        text.style.cssText = `
            display: block;
            margin-bottom: 20px;
            line-height: 1.6;
            color: #3F3F3F;
        `;

        const btn = alertBox.querySelector('.pixel-alert-btn');
        btn.style.cssText = `
            font-family: 'Press Start 2P', cursive;
            font-size: 0.8em;
            padding: 10px 24px;
            background: linear-gradient(180deg, #5D9B47 0%, #4A7C38 100%);
            color: white;
            border: 4px solid #4A7C38;
            cursor: pointer;
            text-shadow: 2px 2px 0 #3F3F3F;
            box-shadow:
                inset 2px 2px 0 rgba(255,255,255,0.4),
                inset -2px -2px 0 rgba(0,0,0,0.4);
        `;

        btn.addEventListener('click', () => {
            alertBox.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => alertBox.remove(), 200);
        });

        document.body.appendChild(alertBox);
    }

    // 添加淡出动画
    const fadeOutStyle = document.createElement('style');
    fadeOutStyle.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(fadeOutStyle);

    // 下载按钮
    downloadBtn.addEventListener('click', () => {
        if (!resultBlob) return;

        // 创建下载粒子效果
        const rect = downloadBtn.getBoundingClientRect();
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                createPixelBurst(
                    rect.left + rect.width / 2 + (Math.random() - 0.5) * 40,
                    rect.top + rect.height / 2,
                    '#4AEDD9'
                );
            }, i * 50);
        }

        const url = URL.createObjectURL(resultBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pixel_cleaned_' + currentFile.name.replace(/\.[^/.]+$/, '') + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // 重置按钮
    resetBtn.addEventListener('click', () => {
        // 添加重置动画
        previewSection.style.transition = 'all 0.3s ease';
        previewSection.style.opacity = '0';
        previewSection.style.transform = 'translateY(20px)';

        setTimeout(() => {
            currentFile = null;
            resultBlob = null;
            imageInput.value = '';
            previewSection.style.display = 'none';

            uploadArea.parentElement.style.display = 'block';
            uploadArea.parentElement.style.opacity = '0';
            uploadArea.parentElement.style.transform = 'translateY(-20px)';

            setTimeout(() => {
                uploadArea.parentElement.style.transition = 'all 0.3s ease';
                uploadArea.parentElement.style.opacity = '1';
                uploadArea.parentElement.style.transform = 'translateY(0)';
            }, 50);

            resultImage.src = '';
            originalImage.src = '';
            downloadBtn.disabled = true;
        }, 300);
    });

    // ============================================
    // 额外的视觉效果
    // ============================================

    // 鼠标移动时的像素跟踪效果（轻量级）
    let lastTrailTime = 0;
    document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        if (now - lastTrailTime < 100) return; // 限制频率
        lastTrailTime = now;

        // 只在容器内显示效果
        const container = document.querySelector('.container');
        const rect = container.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {

            const trail = document.createElement('div');
            trail.style.cssText = `
                position: fixed;
                left: ${e.clientX}px;
                top: ${e.clientY}px;
                width: 4px;
                height: 4px;
                background: rgba(74, 237, 217, 0.3);
                pointer-events: none;
                z-index: 9998;
                animation: trailFade 0.5s ease forwards;
            `;
            document.body.appendChild(trail);
            setTimeout(() => trail.remove(), 500);
        }
    });

    // 添加轨迹动画
    const trailStyle = document.createElement('style');
    trailStyle.textContent = `
        @keyframes trailFade {
            0% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.5); }
        }
    `;
    document.head.appendChild(trailStyle);

    // 初始化欢迎粒子效果
    setTimeout(() => {
        const container = document.querySelector('.container');
        const rect = container.getBoundingClientRect();
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                createPixelBurst(
                    rect.left + Math.random() * rect.width,
                    rect.top + Math.random() * rect.height / 3,
                    ['#5D9B47', '#4AEDD9', '#FCEE4B', '#17DD62'][Math.floor(Math.random() * 4)]
                );
            }, i * 100);
        }
    }, 500);
});
