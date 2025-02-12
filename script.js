document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const controls = document.getElementById('controls');
    const originalImage = document.getElementById('originalImage');
    const compressedImage = document.getElementById('compressedImage');
    const originalInfo = document.getElementById('originalInfo');
    const compressedInfo = document.getElementById('compressedInfo');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');

    // 直接获取元素
    const formatSelect = document.getElementById('format');
    const maintainSizeCheckbox = document.getElementById('maintainSize');
    const maxWidthInput = document.getElementById('maxWidth');
    const compressionInfo = document.getElementById('compressionInfo');
    const maxSizeControl = document.querySelector('.max-size-control');

    // 添加质量警告提示
    const qualityControl = document.querySelector('.quality-control');
    const warningEl = document.createElement('div');
    warningEl.className = 'quality-warning';
    warningEl.textContent = '不建议豚友们用30%以下，可能会丢失图片细节';
    qualityControl.appendChild(warningEl);

    // 更新事件监听
    maintainSizeCheckbox.addEventListener('change', (e) => {
        maxSizeControl.style.display = e.target.checked ? 'none' : 'block';
        compressImage();
    });

    formatSelect.addEventListener('change', compressImage);
    maxWidthInput.addEventListener('change', compressImage);

    // 智能图片分析
    async function analyzeImage(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = imageElement.naturalWidth;
        const height = imageElement.naturalHeight;
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(imageElement, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const { data } = imageData;
        
        // 计算图片复杂度
        let complexity = 0;
        let hasTransparency = false;
        
        for (let i = 0; i < data.length; i += 4) {
            // 检查透明度
            if (data[i + 3] < 255) hasTransparency = true;
            
            // 计算相邻像素的差异
            if (i > 0) {
                complexity += Math.abs(data[i] - data[i - 4]);
                complexity += Math.abs(data[i + 1] - data[i - 3]);
                complexity += Math.abs(data[i + 2] - data[i - 2]);
            }
        }
        
        // 归一化复杂度值到0-100
        complexity = Math.min(100, (complexity / data.length) * 10);
        
        return {
            width,
            height,
            complexity,
            hasTransparency
        };
    }

    // 优化的压缩函数
    async function compressImage() {
        if (!originalImage.src) return;

        try {
            // 显示加载状态
            compressedImage.style.opacity = '0.5';
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 计算目标尺寸
            let targetWidth = originalImage.naturalWidth;
            let targetHeight = originalImage.naturalHeight;
            
            if (!maintainSizeCheckbox.checked) {
                const maxWidth = parseInt(maxWidthInput.value);
                if (targetWidth > maxWidth) {
                    targetHeight = Math.round(maxWidth * (targetHeight / targetWidth));
                    targetWidth = maxWidth;
                }
            }

            // 设置画布尺寸
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            // 启用高质量缩放
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // 绘制图片
            ctx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);
            
            // 获取压缩参数
            const format = formatSelect.value === 'auto' ? 'jpeg' : formatSelect.value;
            const quality = parseInt(qualitySlider.value) / 100;

            // 创建Blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, `image/${format}`, quality);
            });
            
            if (!blob) throw new Error('压缩失败');

            // 清理之前的URL
            if (compressedImage.dataset.previousUrl) {
                URL.revokeObjectURL(compressedImage.dataset.previousUrl);
            }

            // 创建新的URL
            const url = URL.createObjectURL(blob);
            compressedImage.src = url;
            compressedImage.dataset.previousUrl = url;

            // 立即更新压缩信息
            const compressedSize = blob.size / 1024;
            const compressedInfoEl = document.querySelector('#compressedInfo');
            compressedInfoEl.innerHTML = `
                <span class="info-dimensions">尺寸: ${targetWidth}x${targetHeight}</span>
                <span class="info-size">大小: ${compressedSize.toFixed(2)}KB</span>
            `;

        } catch (error) {
            console.error('压缩过程出错:', error);
        } finally {
            compressedImage.style.opacity = '1';
        }
    }

    // 高质量缩放函数
    async function highQualityResize(image, targetWidth, targetHeight) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置目标尺寸
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // 启用高质量缩放
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 直接绘制到目标尺寸
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
        
        return canvas;
    }

    // 修改质量滑块事件监听
    qualitySlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        qualityValue.textContent = value + '%';
        
        // 更新进度条颜色
        const percent = value / 100;
        qualitySlider.style.setProperty('--percent', percent);
        
        // 根据值切换样式并显示/隐藏警告
        if (value < 30) {
            qualitySlider.classList.add('low-quality');
            warningEl.classList.add('show');
        } else {
            qualitySlider.classList.remove('low-quality');
            warningEl.classList.remove('show');
        }
        
        // 更新进度条已完成部分的宽度
        qualitySlider.style.setProperty('--progress-width', `${value}%`);
        
        // 立即更新压缩
        compressImage();
    });

    // 初始化时检查是否需要显示警告
    const initialValue = parseInt(qualitySlider.value);
    if (initialValue < 30) {
        warningEl.classList.add('show');
    }

    // 处理拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.background = '#F5F5F7';
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.background = 'white';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.background = 'white';
        handleFiles(e.dataTransfer.files);
    });

    // 处理点击上传
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // 处理文件
    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件！');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage.src = e.target.result;
            originalImage.onload = () => {
                // 更新原图信息显示
                const originalInfoEl = document.querySelector('#originalInfo');
                originalInfoEl.innerHTML = `
                    <span class="info-dimensions">尺寸: ${originalImage.naturalWidth}x${originalImage.naturalHeight}</span>
                    <span class="info-size">大小: ${(file.size / 1024).toFixed(2)}KB</span>
                `;
                compressImage();
                previewContainer.style.display = 'flex';
                controls.style.display = 'block';
                uploadArea.classList.add('compact');
            };
        };
        reader.readAsDataURL(file);
    }

    // 下载压缩后的图片
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'compressed-image.jpg';
        link.href = compressedImage.src;
        link.click();
    });

    // 在需要加载资源的地方使用 getAssetPath
    const iconPath = window.getAssetPath('assets/capybara-icon.svg');
}); 