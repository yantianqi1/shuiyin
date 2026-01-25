document.addEventListener('DOMContentLoaded', function() {
    // ============================================
    // 元素引用
    // ============================================
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
    const loadingText = document.getElementById('loadingText');
    const threshold = document.getElementById('threshold');
    const thresholdValue = document.getElementById('thresholdValue');

    // 方式选项面板
    const autoOptions = document.getElementById('autoOptions');
    const regionOptions = document.getElementById('regionOptions');
    const colorOptions = document.getElementById('colorOptions');
    const watermarkOptions = document.getElementById('watermarkOptions');

    // 水印相关元素
    const watermarkTabs = document.querySelectorAll('#watermarkOptions .watermark-tab');
    const textWatermarkPanel = document.getElementById('textWatermarkPanel');
    const imageWatermarkPanel = document.getElementById('imageWatermarkPanel');
    const watermarkUploadArea = document.getElementById('watermarkUploadArea');
    const watermarkImageInput = document.getElementById('watermarkImageInput');
    const watermarkPreview = document.getElementById('watermarkPreview');
    const watermarkPosition = document.getElementById('watermarkPosition');
    const customCoords = document.getElementById('customCoords');

    // 水印参数元素
    const watermarkText = document.getElementById('watermarkText');
    const fontSize = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const fontColor = document.getElementById('fontColor');
    const rotation = document.getElementById('rotation');
    const rotationValue = document.getElementById('rotationValue');
    const watermarkScale = document.getElementById('watermarkScale');
    const scaleValue = document.getElementById('scaleValue');
    const watermarkOpacity = document.getElementById('watermarkOpacity');
    const opacityValue = document.getElementById('opacityValue');
    const watermarkMargin = document.getElementById('watermarkMargin');
    const marginValue = document.getElementById('marginValue');
    const customX = document.getElementById('customX');
    const customY = document.getElementById('customY');

    // 输出设置
    const outputFormat = document.getElementById('outputFormat');
    const outputQuality = document.getElementById('outputQuality');
    const qualityValue = document.getElementById('qualityValue');

    // 主题切换
    const themeToggle = document.getElementById('themeToggle');

    // 模式切换
    const modeTabs = document.querySelectorAll('.mode-tab');
    const singleUploadSection = document.getElementById('singleUploadSection');
    const batchUploadSection = document.getElementById('batchUploadSection');
    const batchControls = document.getElementById('batchControls');

    // 批量处理元素
    const batchUploadArea = document.getElementById('batchUploadArea');
    const batchImageInput = document.getElementById('batchImageInput');
    const batchPreviewList = document.getElementById('batchPreviewList');
    const batchThumbnails = document.getElementById('batchThumbnails');
    const batchFileCount = document.getElementById('batchFileCount');
    const batchClearBtn = document.getElementById('batchClearBtn');
    const batchProcessBtn = document.getElementById('batchProcessBtn');
    const batchResetBtn = document.getElementById('batchResetBtn');
    const batchMethodSelect = document.getElementById('batchMethodSelect');
    const batchOutputFormat = document.getElementById('batchOutputFormat');
    const batchOutputQuality = document.getElementById('batchOutputQuality');
    const batchQualityValue = document.getElementById('batchQualityValue');

    // 模板相关
    const saveTemplateBtn = document.getElementById('saveTemplateBtn');
    const templateList = document.getElementById('templateList');

    let currentFile = null;
    let resultBlob = null;
    let watermarkFile = null;
    let currentWatermarkType = 'text';
    let currentMode = 'single';
    let batchFiles = [];
    let batchWatermarkFile = null;
    let batchWatermarkType = 'text';

    // 新水印类型面板引用
    const qrcodeWatermarkPanel = document.getElementById('qrcodeWatermarkPanel');
    const datetimeWatermarkPanel = document.getElementById('datetimeWatermarkPanel');
    const qrcodeScale = document.getElementById('qrcodeScale');
    const qrcodeScaleValue = document.getElementById('qrcodeScaleValue');
    const datetimeFormat = document.getElementById('datetimeFormat');
    const customDatetimeFormatGroup = document.getElementById('customDatetimeFormatGroup');
    const datetimeFontSize = document.getElementById('datetimeFontSize');
    const datetimeFontSizeValue = document.getElementById('datetimeFontSizeValue');
    const datetimeRotation = document.getElementById('datetimeRotation');
    const datetimeRotationValue = document.getElementById('datetimeRotationValue');

    // 区域选择相关
    let isDrawing = false;
    let startX, startY;
    const regionX = document.getElementById('regionX');
    const regionY = document.getElementById('regionY');
    const regionW = document.getElementById('regionW');
    const regionH = document.getElementById('regionH');

    // ============================================
    // 主题切换功能
    // ============================================

    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else if (prefersDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    initTheme();
    themeToggle.addEventListener('click', toggleTheme);

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });

    // ============================================
    // 模式切换功能
    // ============================================

    modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            modeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentMode = tab.dataset.mode;

            if (currentMode === 'single') {
                singleUploadSection.style.display = 'block';
                batchUploadSection.style.display = 'none';
                batchControls.style.display = 'none';
            } else {
                singleUploadSection.style.display = 'none';
                batchUploadSection.style.display = 'block';
                previewSection.style.display = 'none';
                if (batchFiles.length > 0) {
                    batchControls.style.display = 'block';
                }
            }
        });
    });

    // ============================================
    // 单图上传功能
    // ============================================

    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });

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

    // ============================================
    // 批量上传功能
    // ============================================

    batchUploadArea.addEventListener('click', () => {
        batchImageInput.click();
    });

    batchUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        batchUploadArea.classList.add('dragover');
    });

    batchUploadArea.addEventListener('dragleave', () => {
        batchUploadArea.classList.remove('dragover');
    });

    batchUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        batchUploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
            addBatchFiles(files);
        }
    });

    batchImageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            addBatchFiles(Array.from(e.target.files));
        }
    });

    function addBatchFiles(files) {
        batchFiles = batchFiles.concat(files);
        updateBatchPreview();
        batchControls.style.display = 'block';
    }

    function updateBatchPreview() {
        batchFileCount.textContent = batchFiles.length;
        batchThumbnails.innerHTML = '';

        if (batchFiles.length > 0) {
            batchPreviewList.style.display = 'block';

            batchFiles.forEach((file, index) => {
                const thumb = document.createElement('div');
                thumb.className = 'batch-thumbnail';

                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.alt = file.name;

                const removeBtn = document.createElement('button');
                removeBtn.className = 'batch-thumbnail-remove';
                removeBtn.innerHTML = '×';
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    batchFiles.splice(index, 1);
                    updateBatchPreview();
                    if (batchFiles.length === 0) {
                        batchControls.style.display = 'none';
                    }
                };

                thumb.appendChild(img);
                thumb.appendChild(removeBtn);
                batchThumbnails.appendChild(thumb);
            });
        } else {
            batchPreviewList.style.display = 'none';
        }
    }

    batchClearBtn.addEventListener('click', () => {
        batchFiles = [];
        updateBatchPreview();
        batchControls.style.display = 'none';
        batchImageInput.value = '';
    });

    batchResetBtn.addEventListener('click', () => {
        batchFiles = [];
        updateBatchPreview();
        batchControls.style.display = 'none';
        batchImageInput.value = '';
    });

    // ============================================
    // 区域选择功能
    // ============================================

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

            ctx.strokeStyle = '#0D9488';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 4]);
            ctx.fillStyle = 'rgba(13, 148, 136, 0.15)';

            const width = currentX - startX;
            const height = currentY - startY;
            ctx.fillRect(startX, startY, width, height);
            ctx.strokeRect(startX, startY, width, height);

            ctx.setLineDash([]);
            ctx.fillStyle = '#0D9488';
            const cornerSize = 10;

            ctx.fillRect(startX - 2, startY - 2, cornerSize, 3);
            ctx.fillRect(startX - 2, startY - 2, 3, cornerSize);

            ctx.fillRect(startX + width - cornerSize + 2, startY - 2, cornerSize, 3);
            ctx.fillRect(startX + width - 1, startY - 2, 3, cornerSize);

            ctx.fillRect(startX - 2, startY + height - 1, cornerSize, 3);
            ctx.fillRect(startX - 2, startY + height - cornerSize + 2, 3, cornerSize);

            ctx.fillRect(startX + width - cornerSize + 2, startY + height - 1, cornerSize, 3);
            ctx.fillRect(startX + width - 1, startY + height - cornerSize + 2, 3, cornerSize);

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

    // ============================================
    // 方法选择切换
    // ============================================

    methodSelect.addEventListener('change', () => {
        autoOptions.style.display = 'none';
        regionOptions.style.display = 'none';
        colorOptions.style.display = 'none';
        watermarkOptions.style.display = 'none';

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
            case 'add-watermark':
                watermarkOptions.style.display = 'block';
                break;
        }

        setupRegionSelection();
    });

    threshold.addEventListener('input', () => {
        thresholdValue.textContent = threshold.value;
    });

    // ============================================
    // 水印功能相关事件
    // ============================================

    watermarkTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            watermarkTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentWatermarkType = tab.dataset.type;

            // 隐藏所有面板
            textWatermarkPanel.style.display = 'none';
            imageWatermarkPanel.style.display = 'none';
            if (qrcodeWatermarkPanel) qrcodeWatermarkPanel.style.display = 'none';
            if (datetimeWatermarkPanel) datetimeWatermarkPanel.style.display = 'none';

            // 显示对应面板
            if (currentWatermarkType === 'text') {
                textWatermarkPanel.style.display = 'block';
            } else if (currentWatermarkType === 'image') {
                imageWatermarkPanel.style.display = 'block';
            } else if (currentWatermarkType === 'qrcode') {
                qrcodeWatermarkPanel.style.display = 'block';
            } else if (currentWatermarkType === 'datetime') {
                datetimeWatermarkPanel.style.display = 'block';
            }
        });
    });

    watermarkUploadArea.addEventListener('click', () => {
        watermarkImageInput.click();
    });

    watermarkImageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            watermarkFile = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                watermarkPreview.src = e.target.result;
                watermarkPreview.style.display = 'block';
                watermarkUploadArea.querySelector('.watermark-upload-prompt').style.display = 'none';
            };
            reader.readAsDataURL(watermarkFile);
        }
    });

    watermarkPosition.addEventListener('change', () => {
        if (watermarkPosition.value === 'custom') {
            customCoords.style.display = 'flex';
        } else {
            customCoords.style.display = 'none';
        }
    });

    fontSize.addEventListener('input', () => {
        fontSizeValue.textContent = fontSize.value;
    });

    rotation.addEventListener('input', () => {
        rotationValue.textContent = rotation.value + '°';
    });

    watermarkScale.addEventListener('input', () => {
        scaleValue.textContent = watermarkScale.value + '%';
    });

    watermarkOpacity.addEventListener('input', () => {
        opacityValue.textContent = watermarkOpacity.value + '%';
    });

    watermarkMargin.addEventListener('input', () => {
        marginValue.textContent = watermarkMargin.value + 'px';
    });

    // 二维码水印滑块
    if (qrcodeScale) {
        qrcodeScale.addEventListener('input', () => {
            qrcodeScaleValue.textContent = qrcodeScale.value + '%';
        });
    }

    // 日期时间水印滑块和格式切换
    if (datetimeFontSize) {
        datetimeFontSize.addEventListener('input', () => {
            datetimeFontSizeValue.textContent = datetimeFontSize.value;
        });
    }

    if (datetimeRotation) {
        datetimeRotation.addEventListener('input', () => {
            datetimeRotationValue.textContent = datetimeRotation.value + '°';
        });
    }

    if (datetimeFormat) {
        datetimeFormat.addEventListener('change', () => {
            if (datetimeFormat.value === 'custom') {
                customDatetimeFormatGroup.style.display = 'block';
            } else {
                customDatetimeFormatGroup.style.display = 'none';
            }
        });
    }

    // 输出质量滑块
    outputQuality.addEventListener('input', () => {
        qualityValue.textContent = outputQuality.value + '%';
    });

    // ============================================
    // 水印模板功能
    // ============================================

    function getWatermarkSettings() {
        return {
            type: currentWatermarkType,
            text: watermarkText.value,
            fontSize: fontSize.value,
            fontColor: fontColor.value,
            rotation: rotation.value,
            scale: watermarkScale.value,
            opacity: watermarkOpacity.value,
            margin: watermarkMargin.value,
            position: watermarkPosition.value
        };
    }

    function applyWatermarkSettings(settings) {
        if (settings.type === 'text') {
            watermarkTabs.forEach(t => t.classList.remove('active'));
            document.querySelector('.watermark-tab[data-type="text"]').classList.add('active');
            textWatermarkPanel.style.display = 'block';
            imageWatermarkPanel.style.display = 'none';
            currentWatermarkType = 'text';
        } else {
            watermarkTabs.forEach(t => t.classList.remove('active'));
            document.querySelector('.watermark-tab[data-type="image"]').classList.add('active');
            textWatermarkPanel.style.display = 'none';
            imageWatermarkPanel.style.display = 'block';
            currentWatermarkType = 'image';
        }

        watermarkText.value = settings.text || '我的水印';
        fontSize.value = settings.fontSize || 36;
        fontSizeValue.textContent = fontSize.value;
        fontColor.value = settings.fontColor || '#ffffff';
        rotation.value = settings.rotation || 0;
        rotationValue.textContent = rotation.value + '°';
        watermarkScale.value = settings.scale || 20;
        scaleValue.textContent = watermarkScale.value + '%';
        watermarkOpacity.value = settings.opacity || 50;
        opacityValue.textContent = watermarkOpacity.value + '%';
        watermarkMargin.value = settings.margin || 20;
        marginValue.textContent = watermarkMargin.value + 'px';
        watermarkPosition.value = settings.position || 'bottom-right';

        if (settings.position === 'custom') {
            customCoords.style.display = 'flex';
        } else {
            customCoords.style.display = 'none';
        }
    }

    function loadTemplates() {
        const templates = JSON.parse(localStorage.getItem('watermarkTemplates') || '[]');
        templateList.innerHTML = '';

        if (templates.length === 0) {
            templateList.innerHTML = '<span class="template-empty">暂无保存的模板</span>';
            return;
        }

        templates.forEach((template, index) => {
            const item = document.createElement('div');
            item.className = 'template-item';
            item.innerHTML = `
                <span class="template-item-name">${template.name}</span>
                <button type="button" class="template-item-delete" data-index="${index}">×</button>
            `;

            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('template-item-delete')) {
                    applyWatermarkSettings(template.settings);
                    showAlert('已应用模板：' + template.name);
                }
            });

            item.querySelector('.template-item-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                templates.splice(index, 1);
                localStorage.setItem('watermarkTemplates', JSON.stringify(templates));
                loadTemplates();
            });

            templateList.appendChild(item);
        });
    }

    saveTemplateBtn.addEventListener('click', () => {
        const name = prompt('请输入模板名称：');
        if (!name) return;

        const templates = JSON.parse(localStorage.getItem('watermarkTemplates') || '[]');
        templates.push({
            name: name,
            settings: getWatermarkSettings()
        });
        localStorage.setItem('watermarkTemplates', JSON.stringify(templates));
        loadTemplates();
        showAlert('模板已保存：' + name);
    });

    loadTemplates();

    // ============================================
    // 单图处理按钮
    // ============================================

    processBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        loading.style.display = 'flex';
        loadingText.textContent = '正在处理中...';

        const formData = new FormData();
        formData.append('image', currentFile);
        formData.append('format', outputFormat.value);
        formData.append('quality', outputQuality.value);

        const isAddWatermark = methodSelect.value === 'add-watermark';
        let apiUrl = '/api/remove-watermark';

        if (isAddWatermark) {
            apiUrl = '/api/add-watermark';
            formData.append('type', currentWatermarkType);
            formData.append('position', watermarkPosition.value);
            formData.append('opacity', watermarkOpacity.value / 100);
            formData.append('margin', watermarkMargin.value);

            if (watermarkPosition.value === 'custom') {
                formData.append('custom_x', customX.value);
                formData.append('custom_y', customY.value);
            }

            if (currentWatermarkType === 'text') {
                if (!watermarkText.value.trim()) {
                    showAlert('请输入水印文字');
                    loading.style.display = 'none';
                    return;
                }
                formData.append('text', watermarkText.value);
                formData.append('font_size', fontSize.value);
                formData.append('font_color', fontColor.value);
                formData.append('rotation', rotation.value);
            } else if (currentWatermarkType === 'image') {
                if (!watermarkFile) {
                    showAlert('请上传水印图片');
                    loading.style.display = 'none';
                    return;
                }
                formData.append('watermark_image', watermarkFile);
                formData.append('scale', watermarkScale.value / 100);
            } else if (currentWatermarkType === 'qrcode') {
                const qrcodeUrl = document.getElementById('qrcodeUrl').value;
                if (!qrcodeUrl.trim()) {
                    showAlert('请输入二维码链接');
                    loading.style.display = 'none';
                    return;
                }
                formData.append('url', qrcodeUrl);
                formData.append('scale', document.getElementById('qrcodeScale').value / 100);
                formData.append('fill_color', document.getElementById('qrcodeFillColor').value);
                formData.append('back_color', document.getElementById('qrcodeBackColor').value);
            } else if (currentWatermarkType === 'datetime') {
                const dtFormat = document.getElementById('datetimeFormat').value;
                if (dtFormat === 'custom') {
                    const customFormat = document.getElementById('customDatetimeFormat').value;
                    formData.append('custom_text', customFormat || '%Y-%m-%d %H:%M:%S');
                } else {
                    formData.append('format', dtFormat);
                }
                formData.append('font_size', document.getElementById('datetimeFontSize').value);
                formData.append('font_color', document.getElementById('datetimeFontColor').value);
                formData.append('rotation', document.getElementById('datetimeRotation').value);
            }
        } else {
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
        }

        try {
            const response = await fetch(apiUrl, {
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

    // ============================================
    // 批量处理相关
    // ============================================

    // 批量方法切换
    const batchAutoOptions = document.getElementById('batchAutoOptions');
    const batchColorOptions = document.getElementById('batchColorOptions');
    const batchWatermarkOptions = document.getElementById('batchWatermarkOptions');
    const batchRegionOptions = document.getElementById('batchRegionOptions');
    const batchThreshold = document.getElementById('batchThreshold');
    const batchThresholdValue = document.getElementById('batchThresholdValue');

    batchMethodSelect.addEventListener('change', () => {
        batchAutoOptions.style.display = 'none';
        batchColorOptions.style.display = 'none';
        batchWatermarkOptions.style.display = 'none';
        batchRegionOptions.style.display = 'none';

        switch (batchMethodSelect.value) {
            case 'auto':
                batchAutoOptions.style.display = 'block';
                break;
            case 'region':
                batchRegionOptions.style.display = 'block';
                initBatchRegionMarker();
                break;
            case 'color':
                batchColorOptions.style.display = 'block';
                break;
            case 'add-watermark':
                batchWatermarkOptions.style.display = 'block';
                break;
        }
    });

    batchThreshold.addEventListener('input', () => {
        batchThresholdValue.textContent = batchThreshold.value;
    });

    batchOutputQuality.addEventListener('input', () => {
        batchQualityValue.textContent = batchOutputQuality.value + '%';
    });

    // 批量水印标签切换
    const batchTextTab = document.getElementById('batchTextTab');
    const batchImageTab = document.getElementById('batchImageTab');
    const batchQrcodeTab = document.getElementById('batchQrcodeTab');
    const batchDatetimeTab = document.getElementById('batchDatetimeTab');
    const batchTextWatermarkPanel = document.getElementById('batchTextWatermarkPanel');
    const batchImageWatermarkPanel = document.getElementById('batchImageWatermarkPanel');
    const batchQrcodeWatermarkPanel = document.getElementById('batchQrcodeWatermarkPanel');
    const batchDatetimeWatermarkPanel = document.getElementById('batchDatetimeWatermarkPanel');

    function switchBatchWatermarkTab(type) {
        // 移除所有active
        [batchTextTab, batchImageTab, batchQrcodeTab, batchDatetimeTab].forEach(tab => {
            if (tab) tab.classList.remove('active');
        });
        // 隐藏所有面板
        [batchTextWatermarkPanel, batchImageWatermarkPanel, batchQrcodeWatermarkPanel, batchDatetimeWatermarkPanel].forEach(panel => {
            if (panel) panel.style.display = 'none';
        });

        batchWatermarkType = type;

        if (type === 'text') {
            batchTextTab.classList.add('active');
            batchTextWatermarkPanel.style.display = 'block';
        } else if (type === 'image') {
            batchImageTab.classList.add('active');
            batchImageWatermarkPanel.style.display = 'block';
        } else if (type === 'qrcode' && batchQrcodeTab) {
            batchQrcodeTab.classList.add('active');
            batchQrcodeWatermarkPanel.style.display = 'block';
        } else if (type === 'datetime' && batchDatetimeTab) {
            batchDatetimeTab.classList.add('active');
            batchDatetimeWatermarkPanel.style.display = 'block';
        }
    }

    batchTextTab.addEventListener('click', () => switchBatchWatermarkTab('text'));
    batchImageTab.addEventListener('click', () => switchBatchWatermarkTab('image'));
    if (batchQrcodeTab) batchQrcodeTab.addEventListener('click', () => switchBatchWatermarkTab('qrcode'));
    if (batchDatetimeTab) batchDatetimeTab.addEventListener('click', () => switchBatchWatermarkTab('datetime'));

    // 批量日期格式切换
    const batchDatetimeFormat = document.getElementById('batchDatetimeFormat');
    const batchCustomDatetimeFormatGroup = document.getElementById('batchCustomDatetimeFormatGroup');
    if (batchDatetimeFormat) {
        batchDatetimeFormat.addEventListener('change', () => {
            if (batchDatetimeFormat.value === 'custom') {
                batchCustomDatetimeFormatGroup.style.display = 'block';
            } else {
                batchCustomDatetimeFormatGroup.style.display = 'none';
            }
        });
    }

    // 批量日期时间滑块
    const batchDatetimeFontSize = document.getElementById('batchDatetimeFontSize');
    const batchDatetimeFontSizeValue = document.getElementById('batchDatetimeFontSizeValue');
    const batchDatetimeRotation = document.getElementById('batchDatetimeRotation');
    const batchDatetimeRotationValue = document.getElementById('batchDatetimeRotationValue');
    const batchQrcodeScale = document.getElementById('batchQrcodeScale');
    const batchQrcodeScaleValue = document.getElementById('batchQrcodeScaleValue');

    if (batchDatetimeFontSize) {
        batchDatetimeFontSize.addEventListener('input', () => {
            batchDatetimeFontSizeValue.textContent = batchDatetimeFontSize.value;
        });
    }
    if (batchDatetimeRotation) {
        batchDatetimeRotation.addEventListener('input', () => {
            batchDatetimeRotationValue.textContent = batchDatetimeRotation.value + '°';
        });
    }
    if (batchQrcodeScale) {
        batchQrcodeScale.addEventListener('input', () => {
            batchQrcodeScaleValue.textContent = batchQrcodeScale.value + '%';
        });
    }

    // 批量水印图片上传
    const batchWatermarkUploadArea = document.getElementById('batchWatermarkUploadArea');
    const batchWatermarkImageInput = document.getElementById('batchWatermarkImageInput');
    const batchWatermarkPreview = document.getElementById('batchWatermarkPreview');

    batchWatermarkUploadArea.addEventListener('click', () => {
        batchWatermarkImageInput.click();
    });

    batchWatermarkImageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            batchWatermarkFile = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                batchWatermarkPreview.src = e.target.result;
                batchWatermarkPreview.style.display = 'block';
                batchWatermarkUploadArea.querySelector('.watermark-upload-prompt').style.display = 'none';
            };
            reader.readAsDataURL(batchWatermarkFile);
        }
    });

    // 批量水印参数滑块
    const batchFontSize = document.getElementById('batchFontSize');
    const batchFontSizeValue = document.getElementById('batchFontSizeValue');
    const batchRotation = document.getElementById('batchRotation');
    const batchRotationValue = document.getElementById('batchRotationValue');
    const batchWatermarkScale = document.getElementById('batchWatermarkScale');
    const batchScaleValue = document.getElementById('batchScaleValue');
    const batchWatermarkOpacity = document.getElementById('batchWatermarkOpacity');
    const batchOpacityValue = document.getElementById('batchOpacityValue');
    const batchWatermarkMargin = document.getElementById('batchWatermarkMargin');
    const batchMarginValue = document.getElementById('batchMarginValue');

    batchFontSize.addEventListener('input', () => {
        batchFontSizeValue.textContent = batchFontSize.value;
    });

    batchRotation.addEventListener('input', () => {
        batchRotationValue.textContent = batchRotation.value + '°';
    });

    batchWatermarkScale.addEventListener('input', () => {
        batchScaleValue.textContent = batchWatermarkScale.value + '%';
    });

    batchWatermarkOpacity.addEventListener('input', () => {
        batchOpacityValue.textContent = batchWatermarkOpacity.value + '%';
    });

    batchWatermarkMargin.addEventListener('input', () => {
        batchMarginValue.textContent = batchWatermarkMargin.value + 'px';
    });

    // ============================================
    // 批量手动区域标记功能
    // ============================================

    let batchRegionMode = 'unified'; // unified | individual
    let batchCurrentImageIndex = 0;
    let batchRegions = []; // 存储每张图片的区域 [{x, y, w, h}, ...]
    let unifiedRegion = null; // 统一区域
    let isMarking = false;
    let markStartX = 0, markStartY = 0;
    let currentRegion = null;

    // 元素引用
    const regionModeTabs = document.querySelectorAll('.region-mode-tab');
    const regionModeHint = document.getElementById('regionModeHint');
    const regionMarkerImage = document.getElementById('regionMarkerImage');
    const regionMarkerCanvas = document.getElementById('regionMarkerCanvas');
    const regionMarkerPlaceholder = document.getElementById('regionMarkerPlaceholder');
    const regionMarkerToolbar = document.getElementById('regionMarkerToolbar');
    const regionCoordsDisplay = document.getElementById('regionCoordsDisplay');
    const regionNavButtons = document.getElementById('regionNavButtons');
    const regionMarkerProgress = document.getElementById('regionMarkerProgress');
    const regionMarkerTitle = document.getElementById('regionMarkerTitle');
    const clearRegionBtn = document.getElementById('clearRegionBtn');
    const confirmRegionBtn = document.getElementById('confirmRegionBtn');
    const prevImageBtn = document.getElementById('prevImageBtn');
    const nextImageBtn = document.getElementById('nextImageBtn');

    // 模式切换
    regionModeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            regionModeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            batchRegionMode = tab.dataset.mode;

            if (batchRegionMode === 'unified') {
                regionModeHint.textContent = '所有图片使用相同的水印区域，只需标记一次';
                regionNavButtons.style.display = 'none';
                regionMarkerProgress.style.display = 'none';
                regionMarkerTitle.textContent = '标记水印区域';
            } else {
                regionModeHint.textContent = '每张图片可以标记不同的水印区域';
                if (batchFiles.length > 1) {
                    regionNavButtons.style.display = 'flex';
                    regionMarkerProgress.style.display = 'inline';
                }
                updateRegionMarkerProgress();
            }

            // 重新初始化
            batchCurrentImageIndex = 0;
            batchRegions = [];
            unifiedRegion = null;
            initBatchRegionMarker();
        });
    });

    // 初始化区域标记器
    function initBatchRegionMarker() {
        if (batchFiles.length === 0) {
            regionMarkerPlaceholder.style.display = 'flex';
            regionMarkerImage.style.display = 'none';
            regionMarkerCanvas.style.display = 'none';
            regionMarkerToolbar.style.display = 'none';
            regionCoordsDisplay.style.display = 'none';
            return;
        }

        // 初始化区域数组
        if (batchRegions.length !== batchFiles.length) {
            batchRegions = batchFiles.map(() => null);
        }

        loadImageForMarking(batchCurrentImageIndex);
    }

    // 加载图片用于标记
    function loadImageForMarking(index) {
        if (index < 0 || index >= batchFiles.length) return;

        const file = batchFiles[index];
        const reader = new FileReader();

        reader.onload = (e) => {
            regionMarkerImage.src = e.target.result;
            regionMarkerImage.onload = () => {
                setupMarkerCanvas();
                regionMarkerPlaceholder.style.display = 'none';
                regionMarkerImage.style.display = 'block';
                regionMarkerToolbar.style.display = 'flex';
                regionCoordsDisplay.style.display = 'flex';

                // 恢复之前的选区
                if (batchRegionMode === 'unified' && unifiedRegion) {
                    currentRegion = { ...unifiedRegion };
                    drawRegion();
                } else if (batchRegions[index]) {
                    currentRegion = { ...batchRegions[index] };
                    drawRegion();
                } else {
                    currentRegion = null;
                    clearCanvas();
                }

                updateCoordsDisplay();
                updateRegionMarkerProgress();
            };
        };

        reader.readAsDataURL(file);
    }

    // 设置Canvas
    function setupMarkerCanvas() {
        const img = regionMarkerImage;
        const wrapper = document.getElementById('regionMarkerWrapper');

        // 获取图片在容器中的实际显示尺寸
        const containerWidth = wrapper.clientWidth - 4;
        const containerHeight = 350;

        const imgRatio = img.naturalWidth / img.naturalHeight;
        const containerRatio = containerWidth / containerHeight;

        let displayWidth, displayHeight;

        if (imgRatio > containerRatio) {
            displayWidth = containerWidth;
            displayHeight = containerWidth / imgRatio;
        } else {
            displayHeight = containerHeight;
            displayWidth = containerHeight * imgRatio;
        }

        // 设置canvas尺寸为原始图片尺寸（用于精确坐标）
        regionMarkerCanvas.width = img.naturalWidth;
        regionMarkerCanvas.height = img.naturalHeight;

        // 设置canvas显示尺寸
        regionMarkerCanvas.style.width = displayWidth + 'px';
        regionMarkerCanvas.style.height = displayHeight + 'px';
        regionMarkerCanvas.style.display = 'block';

        // 设置图片显示尺寸
        regionMarkerImage.style.width = displayWidth + 'px';
        regionMarkerImage.style.height = displayHeight + 'px';

        // 绑定事件
        bindCanvasEvents();
    }

    // 绑定Canvas事件（支持触摸）
    function bindCanvasEvents() {
        const canvas = regionMarkerCanvas;

        // 移除旧事件
        canvas.onmousedown = null;
        canvas.onmousemove = null;
        canvas.onmouseup = null;
        canvas.onmouseleave = null;
        canvas.ontouchstart = null;
        canvas.ontouchmove = null;
        canvas.ontouchend = null;

        // 获取坐标
        function getCoords(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            let clientX, clientY;
            if (e.touches) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        }

        // 开始标记
        function startMarking(e) {
            e.preventDefault();
            isMarking = true;
            const coords = getCoords(e);
            markStartX = coords.x;
            markStartY = coords.y;
        }

        // 移动中
        function moveMarking(e) {
            if (!isMarking) return;
            e.preventDefault();

            const coords = getCoords(e);
            const x = Math.min(markStartX, coords.x);
            const y = Math.min(markStartY, coords.y);
            const w = Math.abs(coords.x - markStartX);
            const h = Math.abs(coords.y - markStartY);

            currentRegion = { x, y, w, h };
            drawRegion();
            updateCoordsDisplay();
        }

    // 结束标记
        function endMarking() {
            if (!isMarking) return;
            isMarking = false;

            if (currentRegion && currentRegion.w > 5 && currentRegion.h > 5) {
                // 有效选区
            } else {
                currentRegion = null;
            }
        }

        // 鼠标事件
        canvas.onmousedown = startMarking;
        canvas.onmousemove = moveMarking;
        canvas.onmouseup = endMarking;
        canvas.onmouseleave = endMarking;

        // 触摸事件
        canvas.ontouchstart = startMarking;
        canvas.ontouchmove = moveMarking;
        canvas.ontouchend = endMarking;
    }

    // 绘制选区
    function drawRegion() {
        if (!currentRegion) return;

        const ctx = regionMarkerCanvas.getContext('2d');
        const { x, y, w, h } = currentRegion;

        ctx.clearRect(0, 0, regionMarkerCanvas.width, regionMarkerCanvas.height);

        // 半透明遮罩（选区外部变暗）
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, regionMarkerCanvas.width, regionMarkerCanvas.height);

        // 清除选区内部
        ctx.clearRect(x, y, w, h);

        // 选区边框
        ctx.strokeStyle = '#14B8A6';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.strokeRect(x, y, w, h);

        // 角标记
        const cornerSize = Math.min(20, w / 4, h / 4);
        ctx.fillStyle = '#14B8A6';

        // 左上角
        ctx.fillRect(x - 2, y - 2, cornerSize, 4);
        ctx.fillRect(x - 2, y - 2, 4, cornerSize);

        // 右上角
        ctx.fillRect(x + w - cornerSize + 2, y - 2, cornerSize, 4);
        ctx.fillRect(x + w - 2, y - 2, 4, cornerSize);

        // 左下角
        ctx.fillRect(x - 2, y + h - 2, cornerSize, 4);
        ctx.fillRect(x - 2, y + h - cornerSize + 2, 4, cornerSize);

        // 右下角
        ctx.fillRect(x + w - cornerSize + 2, y + h - 2, cornerSize, 4);
        ctx.fillRect(x + w - 2, y + h - cornerSize + 2, 4, cornerSize);

        // 尺寸标签
        ctx.fillStyle = '#14B8A6';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        const label = `${Math.round(w)} × ${Math.round(h)}`;
        const labelY = y > 30 ? y - 10 : y + h + 20;
        ctx.fillText(label, x + w / 2, labelY);
    }

    // 清除Canvas
    function clearCanvas() {
        const ctx = regionMarkerCanvas.getContext('2d');
        ctx.clearRect(0, 0, regionMarkerCanvas.width, regionMarkerCanvas.height);
    }

    // 更新坐标显示
    function updateCoordsDisplay() {
        const batchRegionX = document.getElementById('batchRegionX');
        const batchRegionY = document.getElementById('batchRegionY');
        const batchRegionW = document.getElementById('batchRegionW');
        const batchRegionH = document.getElementById('batchRegionH');

        if (currentRegion) {
            batchRegionX.textContent = Math.round(currentRegion.x);
            batchRegionY.textContent = Math.round(currentRegion.y);
            batchRegionW.textContent = Math.round(currentRegion.w);
            batchRegionH.textContent = Math.round(currentRegion.h);
        } else {
            batchRegionX.textContent = '0';
            batchRegionY.textContent = '0';
            batchRegionW.textContent = '0';
            batchRegionH.textContent = '0';
        }
    }

    // 更新进度显示
    function updateRegionMarkerProgress() {
        if (batchRegionMode === 'individual' && batchFiles.length > 0) {
            regionMarkerProgress.textContent = `${batchCurrentImageIndex + 1} / ${batchFiles.length}`;
            regionMarkerTitle.textContent = `标记第 ${batchCurrentImageIndex + 1} 张图片`;

            prevImageBtn.disabled = batchCurrentImageIndex === 0;
            nextImageBtn.disabled = batchCurrentImageIndex === batchFiles.length - 1;
        }
    }

    // 清除选区按钮
    clearRegionBtn.addEventListener('click', () => {
        currentRegion = null;
        clearCanvas();
        updateCoordsDisplay();
    });

    // 确认选区按钮
    confirmRegionBtn.addEventListener('click', () => {
        if (!currentRegion) {
            showAlert('请先在图片上框选水印区域');
            return;
        }

        if (batchRegionMode === 'unified') {
            unifiedRegion = { ...currentRegion };
            showAlert('已设置统一水印区域，将应用到所有图片');
        } else {
            batchRegions[batchCurrentImageIndex] = { ...currentRegion };

            // 自动跳转下一张
            if (batchCurrentImageIndex < batchFiles.length - 1) {
                batchCurrentImageIndex++;
                loadImageForMarking(batchCurrentImageIndex);
            } else {
                showAlert('所有图片的水印区域已标记完成');
            }
        }
    });

    // 上一张按钮
    prevImageBtn.addEventListener('click', () => {
        if (batchCurrentImageIndex > 0) {
            // 保存当前选区
            if (currentRegion) {
                batchRegions[batchCurrentImageIndex] = { ...currentRegion };
            }
            batchCurrentImageIndex--;
            loadImageForMarking(batchCurrentImageIndex);
        }
    });

    // 下一张按钮
    nextImageBtn.addEventListener('click', () => {
        if (batchCurrentImageIndex < batchFiles.length - 1) {
            // 保存当前选区
            if (currentRegion) {
                batchRegions[batchCurrentImageIndex] = { ...currentRegion };
            }
            batchCurrentImageIndex++;
            loadImageForMarking(batchCurrentImageIndex);
        }
    });

    // 当批量文件变化时更新（重写addBatchFiles函数）
    addBatchFiles = function(files) {
        batchFiles = batchFiles.concat(files);
        updateBatchPreview();
        batchControls.style.display = 'block';

        // 重置区域数据
        batchRegions = batchFiles.map(() => null);
        batchCurrentImageIndex = 0;
        unifiedRegion = null;

        // 如果当前是区域模式，初始化标记器
        if (batchMethodSelect.value === 'region') {
            initBatchRegionMarker();
        }
    };

    // 批量处理按钮
    batchProcessBtn.addEventListener('click', async () => {
        if (batchFiles.length === 0) {
            showAlert('请先上传图片');
            return;
        }

        loading.style.display = 'flex';
        loadingText.textContent = `正在处理 ${batchFiles.length} 张图片...`;

        const formData = new FormData();

        batchFiles.forEach((file) => {
            formData.append('images', file);
        });

        formData.append('format', batchOutputFormat.value);
        formData.append('quality', batchOutputQuality.value);

        let apiUrl;
        const method = batchMethodSelect.value;

        if (method === 'add-watermark') {
            apiUrl = '/api/batch-add-watermark';
            formData.append('type', batchWatermarkType);
            formData.append('position', document.getElementById('batchWatermarkPosition').value);
            formData.append('opacity', batchWatermarkOpacity.value / 100);
            formData.append('margin', batchWatermarkMargin.value);

            if (batchWatermarkType === 'text') {
                const text = document.getElementById('batchWatermarkText').value;
                if (!text.trim()) {
                    showAlert('请输入水印文字');
                    loading.style.display = 'none';
                    return;
                }
                formData.append('text', text);
                formData.append('font_size', batchFontSize.value);
                formData.append('font_color', document.getElementById('batchFontColor').value);
                formData.append('rotation', batchRotation.value);
            } else if (batchWatermarkType === 'image') {
                if (!batchWatermarkFile) {
                    showAlert('请上传水印图片');
                    loading.style.display = 'none';
                    return;
                }
                formData.append('watermark_image', batchWatermarkFile);
                formData.append('scale', batchWatermarkScale.value / 100);
            } else if (batchWatermarkType === 'qrcode') {
                const url = document.getElementById('batchQrcodeUrl').value;
                if (!url.trim()) {
                    showAlert('请输入二维码链接');
                    loading.style.display = 'none';
                    return;
                }
                formData.append('url', url);
                formData.append('scale', document.getElementById('batchQrcodeScale').value / 100);
                formData.append('fill_color', document.getElementById('batchQrcodeFillColor').value);
                formData.append('back_color', document.getElementById('batchQrcodeBackColor').value);
            } else if (batchWatermarkType === 'datetime') {
                const dtFormat = document.getElementById('batchDatetimeFormat').value;
                if (dtFormat === 'custom') {
                    const customFormat = document.getElementById('batchCustomDatetimeFormat').value;
                    formData.append('custom_text', customFormat || '%Y-%m-%d %H:%M:%S');
                } else {
                    formData.append('datetime_format', dtFormat);
                }
                formData.append('font_size', document.getElementById('batchDatetimeFontSize').value);
                formData.append('font_color', document.getElementById('batchDatetimeFontColor').value);
                formData.append('rotation', document.getElementById('batchDatetimeRotation').value);
            }
        } else {
            apiUrl = '/api/batch-remove-watermark';
            formData.append('method', method);

            if (method === 'auto') {
                formData.append('threshold', batchThreshold.value);
            } else if (method === 'color') {
                formData.append('color_lower', document.getElementById('batchColorLower').value);
                formData.append('color_upper', document.getElementById('batchColorUpper').value);
            } else if (method === 'region') {
                // 手动区域模式
                if (batchRegionMode === 'unified') {
                    if (!unifiedRegion) {
                        showAlert('请先标记水印区域');
                        loading.style.display = 'none';
                        return;
                    }
                    formData.append('region_mode', 'unified');
                    formData.append('region_x', Math.round(unifiedRegion.x));
                    formData.append('region_y', Math.round(unifiedRegion.y));
                    formData.append('region_w', Math.round(unifiedRegion.w));
                    formData.append('region_h', Math.round(unifiedRegion.h));
                } else {
                    // 逐张标记模式
                    const hasAllRegions = batchRegions.every(r => r !== null);
                    if (!hasAllRegions) {
                        const markedCount = batchRegions.filter(r => r !== null).length;
                        showAlert(`还有 ${batchFiles.length - markedCount} 张图片未标记水印区域`);
                        loading.style.display = 'none';
                        return;
                    }
                    formData.append('region_mode', 'individual');
                    formData.append('regions', JSON.stringify(batchRegions.map(r => ({
                        x: Math.round(r.x),
                        y: Math.round(r.y),
                        w: Math.round(r.w),
                        h: Math.round(r.h)
                    }))));
                }
            }
        }

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('处理失败');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = method === 'add-watermark' ? 'watermarked.zip' : 'watermark_removed.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showAlert(`���功处理 ${batchFiles.length} 张图片！`);

        } catch (error) {
            showAlert('处理失败：' + error.message);
        } finally {
            loading.style.display = 'none';
        }
    });

    // ============================================
    // 提示框
    // ============================================

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
                    background: var(--glass-bg-hover);
                    backdrop-filter: blur(20px);
                    padding: 32px 40px;
                    border-radius: 16px;
                    border: 1px solid var(--glass-border);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                    text-align: center;
                    max-width: 400px;
                ">
                    <svg style="width: 48px; height: 48px; color: var(--primary); margin-bottom: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p style="color: var(--text-primary); font-size: 1rem; margin-bottom: 24px; line-height: 1.6;">${message}</p>
                    <button style="
                        font-family: inherit;
                        font-size: 0.95rem;
                        font-weight: 600;
                        padding: 12px 32px;
                        background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
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

    // ============================================
    // 下载按钮
    // ============================================

    downloadBtn.addEventListener('click', () => {
        if (!resultBlob) return;

        const url = URL.createObjectURL(resultBlob);
        const a = document.createElement('a');
        a.href = url;
        const ext = outputFormat.value === 'jpg' ? 'jpg' : outputFormat.value;
        a.download = 'processed_' + currentFile.name.replace(/\.[^/.]+$/, '') + '.' + ext;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // ============================================
    // 重置按钮
    // ============================================

    resetBtn.addEventListener('click', () => {
        previewSection.style.transition = 'all 0.3s ease';
        previewSection.style.opacity = '0';
        previewSection.style.transform = 'translateY(10px)';

        setTimeout(() => {
            currentFile = null;
            resultBlob = null;
            watermarkFile = null;
            imageInput.value = '';
            watermarkImageInput.value = '';
            previewSection.style.display = 'none';

            watermarkPreview.style.display = 'none';
            watermarkPreview.src = '';
            const watermarkPrompt = watermarkUploadArea.querySelector('.watermark-upload-prompt');
            if (watermarkPrompt) {
                watermarkPrompt.style.display = 'flex';
            }

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
