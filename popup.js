document.getElementById("summarize").addEventListener("click", () => {
    const result = document.getElementById("result");
    const summaryType = document.getElementById("summary-type").value;

    result.innerHTML = '<div class="loader"></div>';

    // Get the API key from Chrome Storage
    chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {

        if (!geminiApiKey) {
            result.textContent = "No API key is set.";
            return;
        }

        // Get the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {

            chrome.tabs.sendMessage(
                tab.id,
                { type: "GET_ARTICLE_TEXT" },
                async (response) => {

                    // Handle message errors
                    if (chrome.runtime.lastError) {
                        result.textContent = chrome.runtime.lastError.message;
                        return;
                    }

                    if (!response || !response.text) {
                        result.textContent = "Could not extract text from the page.";
                        return;
                    }

                    try {
                        const summary = await getGeminiSummary(
                            response.text,
                            summaryType,
                            geminiApiKey
                        );

                        result.textContent = summary;

                    } catch (error) {
                        result.textContent = "Gemini Error: " + error.message;
                        console.error(error);
                    }
                }
            );
        });
    });
});


async function getGeminiSummary(rawText, summaryType, geminiApiKey) {

    const maxLength = 2000;
    const text =
        rawText.length > maxLength
            ? rawText.slice(0, maxLength) + "..."
            : rawText;

    const promptMap = {
        brief: `Summarize the following article in 2-3 sentences:\n\n${text}`,

        detailed: `Provide a detailed summary of the following article:\n\n${text}`,

        bullets: `Summarize the following article into 5-7 bullet points. Start each point with "- ":\n\n${text}`
    };

    const prompt = promptMap[summaryType] || promptMap.brief;

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.2
                }
            })
        }
    );

    // Proper error handling
    if (!res.ok) {
        const err = await res.json();
        console.error("Gemini API Error:", err);

        throw new Error(
            err.error?.message ||
            `HTTP ${res.status}: ${res.statusText}`
        );
    }

    const data = await res.json();

    return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No summary returned."
    );
}

document.getElementById("copy-btn").addEventListener("click",()=>{
    const summaryType=document.getElementById("result").innerText;
    if(summaryType && summaryType.trim() !==""){
        navigator.clipboard
        .writeText(summaryType)
        .then(()=>{
            const copyBtn=document.getElementById("copy-btn");
            const originalText=copyBtn.innerText;

            copyBtn.innerText="Copied!";
            setTimeout(()=>{
                copyBtn.innerText=originalText;
            },2000);
        })
        .catch(error=>{
            console.log("Failed to copy text: ",err);
        });
    }
     
})