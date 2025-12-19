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
    const errorMessage = document.getElementById('errorMessage');

    let fileContent = '';
    let copyTimeoutId = null;
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

    // Trigger file input when upload button is clicked
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                showError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
                fileInput.value = '';
                return;
            }

            // Validate file type
            if (!isTextFile(file)) {
                showError('The selected file does not appear to be a text-based file. Please choose a text file (for example, .txt, .md, .csv, or .json).');
                fileInput.value = '';
                return;
            }

            readFile(file);
        }
    });

    // Basic check to see if the selected file is likely to be text
    function isTextFile(file) {
        // Prefer MIME type when available
        if (file.type) {
            if (file.type.startsWith('text/')) {
                return true;
            }
            // Allow a few common text-based MIME types that are not text/*
            const additionalTextTypes = [
                'application/json',
                'application/xml',
                'application/javascript'
            ];
            if (additionalTextTypes.includes(file.type)) {
                return true;
            }
        }

        // Fallback: check by file extension
        const textExtensions = [
            '.txt', '.md', '.markdown', '.csv', '.tsv',
            '.json', '.xml', '.html', '.htm',
            '.js', '.ts', '.css', '.log'
        ];
        const name = (file.name || '').toLowerCase();
        return textExtensions.some((ext) => name.endsWith(ext));
    }

    // Read the selected file
    function readFile(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
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
                hideError();

                // Check if code block has overflow to show gradient indicator
                setTimeout(() => {
                    const pre = codeSection.querySelector('pre');
                    if (pre.scrollHeight > pre.clientHeight) {
                        pre.classList.add('has-overflow');
                    } else {
                        pre.classList.remove('has-overflow');
                    }
                }, 100);

                // Reset copy button state only if no copy operation is in progress
                if (!copyBtn.disabled) {
                    resetCopyButton();
                }
            } catch (err) {
                console.error('Failed to process file as text.', err);
                showError('The selected file could not be processed as text. Please make sure you choose a valid text file.');
                fileContent = '';
                fileInfo.style.display = 'none';
                codeSection.style.display = 'none';
            }
        };

        reader.onerror = () => {
            showError('Error reading file. Please try again.');
        };

        // Read as text with UTF-8 encoding
        reader.readAsText(file, 'UTF-8');
    }

    // Analyze text content and report a *description* of characters, not true file encoding
    function detectEncoding(text) {
        // NOTE:
        // - The file is always read as UTF-8 text (see reader.readAsText on line 127).
        // - We therefore cannot reliably detect the original on-disk encoding here.
        // - This function only reports whether the decoded text is ASCII-only or
        //   contains non-ASCII characters, and clearly labels UTF-8 as "assumed".
        
        // Check if all characters are in the ASCII range (0x00-0x7F)
        const isAscii = /^[\x00-\x7F]*$/.test(text);
        if (isAscii) {
            // ASCII is a subset of UTF-8; the original encoding is still unknown.
            return 'ASCII';
        }
        
        // The text contains non-ASCII characters; we assume UTF-8 but cannot verify
        // the original file encoding without analyzing raw bytes.
        return 'UTF-8';
    }

    // Copy to clipboard functionality
    copyBtn.addEventListener('click', async () => {
        if (!fileContent) {
            return;
        }

        // Clear any existing timeout to prevent race conditions
        if (copyTimeoutId) {
            clearTimeout(copyTimeoutId);
            copyTimeoutId = null;
        }

        // Show spinner
        copyText.textContent = 'Copying...';
        copyText.setAttribute('aria-busy', 'true');
        copySpinner.style.display = 'inline-block';
        copyBtn.disabled = true;

        try {
            // Use the Clipboard API (requires HTTPS or localhost)
            await navigator.clipboard.writeText(fileContent);

            // Show success state
            copySpinner.style.display = 'none';
            copyText.textContent = 'Copied Successfully!';
            copyText.setAttribute('aria-busy', 'false');
            copyBtn.classList.add('success');

            // Reset after 2 seconds
            copyTimeoutId = setTimeout(() => {
                resetCopyButton();
                copyTimeoutId = null;
            }, 2000);

        } catch (err) {
            // Derive a more helpful error message for the user
            let errorMessage = 'Copy failed. Please try again.';

            if (!navigator.clipboard) {
                errorMessage = 'Copy not supported in this browser – please use Ctrl+C (or ⌘+C on Mac) to copy manually.';
            } else if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
                errorMessage = 'Clipboard access was denied. Please check your browser permissions and try again.';
            } else if (err && (err.name === 'NotSupportedError' || err.name === 'AbortError')) {
                errorMessage = 'Copy action is not supported. Please use Ctrl+C (or ⌘+C on Mac) to copy manually.';
            } else if (err && typeof err.message === 'string' && err.message.trim() !== '') {
                // Use a generic prefix so the message remains understandable to non-technical users
                errorMessage = 'Copy failed: ' + err.message;
            }

            console.error('Failed to copy:', err);
            
            copySpinner.style.display = 'none';
            copyText.textContent = errorMessage;
            copyText.setAttribute('aria-busy', 'false');
            
            copyTimeoutId = setTimeout(() => {
                resetCopyButton();
                copyTimeoutId = null;
            }, 3000);
        }
    });

    // Reset copy button to initial state
    function resetCopyButton() {
        copyBtn.disabled = false;
        copyBtn.classList.remove('success');
        copyText.textContent = 'Copy to Clipboard';
        copyText.setAttribute('aria-busy', 'false');
        copySpinner.style.display = 'none';
    }

    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    // Hide error message
    function hideError() {
        errorMessage.style.display = 'none';
    }
});
