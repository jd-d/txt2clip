// txt2clip - Main JavaScript functionality

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInfo = document.getElementById('fileInfo');
    const codeSection = document.getElementById('codeSection');
    const codeBlock = document.getElementById('codeBlock');
    const copyBtn = document.getElementById('copyBtn');
    const copyText = document.getElementById('copyText');
    const copySpinner = document.getElementById('copySpinner');
    const encodingSpan = document.getElementById('encoding');
    const charCountSpan = document.getElementById('charCount');

    let fileContent = '';

    // Trigger file input when upload button is clicked
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            readFile(file);
        }
    });

    // Read the selected file
    function readFile(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            fileContent = e.target.result;
            
            // Detect encoding (simplified - assumes UTF-8 for most files)
            const encoding = detectEncoding(fileContent);
            encodingSpan.textContent = encoding;

            // Count characters
            const charCount = fileContent.length;
            charCountSpan.textContent = charCount.toLocaleString();

            // Display the content
            codeBlock.textContent = fileContent;

            // Show the file info and code section
            fileInfo.style.display = 'block';
            codeSection.style.display = 'block';

            // Reset copy button state
            resetCopyButton();
        };

        reader.onerror = () => {
            alert('Error reading file. Please try again.');
        };

        // Read as text with UTF-8 encoding
        reader.readAsText(file, 'UTF-8');
    }

    // Analyze text content and report encoding type
    function detectEncoding(text) {
        // Note: File is read as UTF-8 (line 61), so this checks if the content
        // is ASCII-compatible (only contains ASCII characters) or requires UTF-8
        // This is a simplified approach - true encoding detection would need
        // to analyze the raw bytes before decoding
        
        // Check if all characters are in the ASCII range (0x00-0x7F)
        const isAscii = /^[\x00-\x7F]*$/.test(text);
        if (isAscii) {
            return 'ASCII';
        }
        
        return 'UTF-8';
    }

    // Copy to clipboard functionality
    copyBtn.addEventListener('click', async () => {
        if (!fileContent) {
            return;
        }

        // Show spinner
        copyText.textContent = 'Copying...';
        copySpinner.style.display = 'inline-block';
        copyBtn.disabled = true;

        try {
            // Use the Clipboard API (requires HTTPS or localhost)
            await navigator.clipboard.writeText(fileContent);

            // Show success state
            copySpinner.style.display = 'none';
            copyText.textContent = 'Copied Successfully!';
            copyBtn.classList.add('success');

            // Reset after 2 seconds
            setTimeout(() => {
                resetCopyButton();
            }, 2000);

        } catch (err) {
            // Fallback for older browsers or if clipboard access is denied
            console.error('Failed to copy:', err);
            
            copySpinner.style.display = 'none';
            copyText.textContent = 'Copy Failed - Try Again';
            
            setTimeout(() => {
                resetCopyButton();
            }, 2000);
        }
    });

    // Reset copy button to initial state
    function resetCopyButton() {
        copyBtn.disabled = false;
        copyBtn.classList.remove('success');
        copyText.textContent = 'Copy to Clipboard';
        copySpinner.style.display = 'none';
    }
});
