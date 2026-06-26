
function getArticleText(){
    const article= document.querySelector("article");
    if(article){
        return article.innerText
    }

    const paragraps=Array.from(document.querySelectorAll("p"));

    return paragraps.map((p)=>p.innerText).join("\n");
}

chrome.runtime.onMessage.addListener((req,sender,sendResponse)=>{
    if((req.type==="GET_ARTICLE_TEXT")){
        const text=getArticleText();
        sendResponse({text});
    }
})