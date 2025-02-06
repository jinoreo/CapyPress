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

    // 处理质量滑块
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value + '%';
        compressImage();
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
                originalInfo.textContent = `尺寸: ${originalImage.naturalWidth}x${originalImage.naturalHeight} | 大小: ${(file.size / 1024).toFixed(2)}KB`;
                compressImage();
                previewContainer.style.display = 'flex';
                controls.style.display = 'block';
            };
        };
        reader.readAsDataURL(file);
    }

    // 压缩图片
    function compressImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置canvas尺寸
        canvas.width = originalImage.naturalWidth;
        canvas.height = originalImage.naturalHeight;
        
        // 绘制图片
        ctx.drawImage(originalImage, 0, 0);
        
        // 压缩
        const quality = qualitySlider.value / 100;
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // 显示压缩后的图片
        compressedImage.src = compressedDataUrl;
        
        // 计算压缩后的大小
        const compressedSize = (compressedDataUrl.length * 3/4) / 1024;
        compressedInfo.textContent = `尺寸: ${canvas.width}x${canvas.height} | 大小: ${compressedSize.toFixed(2)}KB`;
    }

    // 下载压缩后的图片
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'compressed-image.jpg';
        link.href = compressedImage.src;
        link.click();
    });
}); 