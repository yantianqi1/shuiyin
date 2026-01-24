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

    // 点击上传区域
    uploadArea.addEventListener('click', () => imageInput.click());

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
            uploadArea.parentElement.style.display = 'none';
            previewSection.style.display = 'block';
            resultImage.style.display = 'none';
            resultPlaceholder.style.display = 'block';
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
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';

            const width = currentX - startX;
            const height = currentY - startY;
            ctx.fillRect(startX, startY, width, height);
            ctx.strokeRect(startX, startY, width, height);

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
        autoOptions.style.display = 'none';
        regionOptions.style.display = 'none';
        colorOptions.style.display = 'none';

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
        } catch (error) {
            alert('处理失败：' + error.message);
        } finally {
            loading.style.display = 'none';
        }
    });

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
        currentFile = null;
        resultBlob = null;
        imageInput.value = '';
        uploadArea.parentElement.style.display = 'block';
        previewSection.style.display = 'none';
        resultImage.src = '';
        originalImage.src = '';
        downloadBtn.disabled = true;
    });
});
