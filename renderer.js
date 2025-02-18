let toasts = {};

window.electronAPI.onCreate((event, data) => {
    createToast(data);
});

document.body.addEventListener("mouseenter", function (){
    window.electronAPI.setIgnoreMouseEvents(true);
});

async function createToast(data){
    let _el = document.createElement("div");
    let _id = "T"+Date.now();

    _el.classList.add("toast");
    _el.id = _id;
    _el.style.background = data.background;
    _el.style.height = (data.height - 10)+"px";
    _el.style.fontSize = data.style.fontSize+"px";
    _el.style.color = data.color;
    _el.innerHTML = `
        <div class="icon">
            <img width="${data.style.iconSize}" src="${data.icon}">
        </div>
        <div class="content">
            <span class="header">${data.title}</span>
            <span class="message">${data.message}</span>
        </div>
        <div id="close">
            <svg fill="${data.color}" viewBox="4 5 23 23">
                <path d="M18.8,16l5.5-5.5c0.8-0.8,0.8-2,0-2.8l0,0C24,7.3,23.5,7,23,7c-0.5,0-1,0.2-1.4,0.6L16,13.2l-5.5-5.5  c-0.8-0.8-2.1-0.8-2.8,0C7.3,8,7,8.5,7,9.1s0.2,1,0.6,1.4l5.5,5.5l-5.5,5.5C7.3,21.9,7,22.4,7,23c0,0.5,0.2,1,0.6,1.4  C8,24.8,8.5,25,9,25c0.5,0,1-0.2,1.4-0.6l5.5-5.5l5.5,5.5c0.8,0.8,2.1,0.8,2.8,0c0.8-0.8,0.8-2.1,0-2.8L18.8,16z"/>
            </svg>
        </div>
    `;

    document.body.append(_el);

    document.querySelector("#"+_id+" #close").addEventListener("click", function (){
        destroyToast(_id);
    });

    document.getElementById(_id).addEventListener("mouseenter", function (){
        window.electronAPI.setIgnoreMouseEvents(false);
    });

    document.getElementById(_id).addEventListener("mouseleave", function (){
        window.electronAPI.setIgnoreMouseEvents(true);
    });

    toasts[_id] = {
        id: _id,
        duration: data.duration
    }

    await showToast(_id);
}

async function showToast(id){
    document.getElementById(id).classList.add("show");
    if(toasts[id].duration>0){
        await delay(toasts[id].duration);
        await destroyToast(id);
    }
}

async function destroyToast(id){
    document.getElementById(id).classList.remove("show");
    document.getElementById(id).classList.add("hide");
    await delay(200);
    delete toasts[id];
    document.getElementById(id).remove();
    window.electronAPI.checkWindowDestroy(Object.keys(toasts).length);
}

function delay(amount){
    return new Promise(resolve => {
        setTimeout(resolve, amount);
    });
}
