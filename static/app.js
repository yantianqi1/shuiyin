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

            if (currentWatermarkType === 'text') {
                textWatermarkPanel.style.display = 'block';
                imageWatermarkPanel.style.display = 'none';
            } else {
                textWatermarkPanel.style.display = 'none';
                imageWatermarkPanel.style.display = 'block';
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
            } else {
                if (!watermarkFile) {
                    showAlert('请上传水印图片');
                    loading.style.display = 'none';
                    return;
                }
                formData.append('watermark_image', watermarkFile);
                formData.append('scale', watermarkScale.value / 100);
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
    const batchThreshold = document.getElementById('batchThreshold');
    const batchThresholdValue = document.getElementById('batchThresholdValue');

    batchMethodSelect.addEventListener('change', () => {
        batchAutoOptions.style.display = 'none';
        batchColorOptions.style.display = 'none';
        batchWatermarkOptions.style.display = 'none';

        switch (batchMethodSelect.value) {
            case 'auto':
                batchAutoOptions.style.display = 'block';
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
    const batchTextWatermarkPanel = document.getElementById('batchTextWatermarkPanel');
    const batchImageWatermarkPanel = document.getElementById('batchImageWatermarkPanel');

    batchTextTab.addEventListener('click', () => {
        batchTextTab.classList.add('active');
        batchImageTab.classList.remove('active');
        batchTextWatermarkPanel.style.display = 'block';
        batchImageWatermarkPanel.style.display = 'none';
        batchWatermarkType = 'text';
    });

    batchImageTab.addEventListener('click', () => {
        batchImageTab.classList.add('active');
        batchTextTab.classList.remove('active');
        batchTextWatermarkPanel.style.display = 'none';
        batchImageWatermarkPanel.style.display = 'block';
        batchWatermarkType = 'image';
    });

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

    // 批量处理按钮
    batchProcessBtn.addEventListener('click', async () => {
        if (batchFiles.length === 0) {
            showAlert('请先上传图片');
            return;
        }

        loading.style.display = 'flex';
        loadingText.textContent = `正在处理 ${batchFiles.length} 张图片...`;

        const formData = new FormData();

        batchFiles.forEach((file, index) => {
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
            } else {
                if (!batchWatermarkFile) {
                    showAlert('请上传水印图片');
                    loading.style.display = 'none';
                    return;
                }
                formData.append('watermark_image', batchWatermarkFile);
                formData.append('scale', batchWatermarkScale.value / 100);
            }
        } else {
            apiUrl = '/api/batch-remove-watermark';
            formData.append('method', method);

            if (method === 'auto') {
                formData.append('threshold', batchThreshold.value);
            } else if (method === 'color') {
                formData.append('color_lower', document.getElementById('batchColorLower').value);
                formData.append('color_upper', document.getElementById('batchColorUpper').value);
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
