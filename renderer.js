let toasts = {'calls': null, 'msgs': null};

window.electronAPI.onCreate((event, data) => {
    console.log('electronAPI.onCreate');
    if(toasts[data.id]){
        updateToast(data);
        return;
    }
    createToast(data);
});

window.electronAPI.onClose((event, data) => {
    console.log('electronAPI.onClose');
    if(toasts[data.id]){
        destroyToast(data.id);
    }
});

window.setInterval(function(){
    var timeAgoEls = document.querySelectorAll(".time-ago");
    timeAgoEls.forEach((ta) => {
        ta.innerHTML = timeAgo(ta.dataset.ts);
    });
},5000);

function timeAgo(unix_timestamp,short) {
    var date = new Date(unix_timestamp * 1000);
    const MINUTE = 60;
    const HOUR = MINUTE * 60;
    const DAY = HOUR * 24;
    const WEEK = DAY * 7;
    const MONTH = DAY * 30;
    const YEAR = DAY * 365;
    const secondsAgo = Math.round((Date.now() - Number(date)) / 1000);
    if (secondsAgo < MINUTE) {
        if(short){
            return secondsAgo + `sec${secondsAgo !== 1 ? "s" : ""}`;
        }
        return secondsAgo + ` sec${secondsAgo !== 1 ? "s" : ""} ago`;
    }
    let divisor;
    let unit = "";
    if (secondsAgo < HOUR) {
        [divisor, unit] = [MINUTE, "min"];
    } else if (secondsAgo < DAY) {
        [divisor, unit] = [HOUR, "hour"];
    } else if (secondsAgo < WEEK) {
        [divisor, unit] = [DAY, "day"];
    } else if (secondsAgo < MONTH) {
        [divisor, unit] = [WEEK, "week"];
    } else if (secondsAgo < YEAR) {
        [divisor, unit] = [MONTH, "month"];
    } else {
        [divisor, unit] = [YEAR, "year"];
    }
    const count = Math.floor(secondsAgo / divisor);
    if(short){
        return `${count}${unit}${count > 1 ? "s" : ""}`;
    }
    return `${count} ${unit}${count > 1 ? "s" : ""} ago`;
}

async function createToast(data){
    console.log('createToast',data)
    let _el = document.createElement("div");
    let _id = data.id;

    _el.classList.add("fvtoast");
    _el.id = _id;
    _el.style.background = data.background;
    _el.style.height = "fit-content";
    _el.style.fontSize = data.style.fontSize+"px";
    _el.style.color = data.color;
    _el.innerHTML = `
        <div class="icon text-white pt-2">
            ${(data.id=='calls'?`<div id="ringer-container" >
       <svg class="RingerPhone" width="${data.style.iconSize}" height="${data.style.iconSize}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4.5 31.82C4.61 31.4989 4.7999 31.2111 5.05182 30.9837C5.30374 30.7563 5.60939 30.5967 5.94 30.52L17.94 27.78C18.2657 27.7061 18.6048 27.715 18.9262 27.8059C19.2476 27.8967 19.5411 28.0666 19.78 28.3C20.06 28.56 20.08 28.58 21.38 31.06C25.6936 29.0723 29.15 25.6017 31.12 21.28C28.58 20 28.56 20 28.3 19.7C28.0666 19.4611 27.8967 19.1676 27.8059 18.8462C27.715 18.5248 27.7061 18.1857 27.78 17.86L30.52 6C30.5967 5.66939 30.7563 5.36374 30.9837 5.11182C31.2111 4.8599 31.4989 4.67 31.82 4.56C32.2871 4.39318 32.7694 4.2726 33.26 4.2C33.7655 4.08279 34.2813 4.0158 34.8 4C37.24 4 39.58 4.96928 41.3054 6.69462C43.0307 8.41995 44 10.76 44 13.2C43.9894 21.3654 40.741 29.1934 34.9672 34.9672C29.1934 40.741 21.3654 43.9894 13.2 44C11.9918 44 10.7955 43.762 9.67931 43.2997C8.56312 42.8373 7.54892 42.1597 6.69462 41.3054C5.84032 40.4511 5.16265 39.4369 4.70031 38.3207C4.23797 37.2045 4 36.0082 4 34.8C3.99938 34.2909 4.03951 33.7827 4.12 33.28C4.20405 32.7832 4.3312 32.2947 4.5 31.82Z" fill="currentColor"/>
<path id="p1" d="M22 16C20.4087 16 18.8826 16.6321 17.7574 17.7574C16.6321 18.8826 16 20.4087 16 22C16 22.5304 15.7893 23.0391 15.4142 23.4142C15.0391 23.7893 14.5304 24 14 24C13.4696 24 12.9609 23.7893 12.5858 23.4142C12.2107 23.0391 12 22.5304 12 22C12 19.3478 13.0536 16.8043 14.9289 14.9289C16.8043 13.0536 19.3478 12 22 12C22.5304 12 23.0391 12.2107 23.4142 12.5858C23.7893 12.9609 24 13.4696 24 14C24 14.5304 23.7893 15.0391 23.4142 15.4142C23.0391 15.7893 22.5304 16 22 16V16Z" fill="currentColor"/>
<path id="p2" d="M12.1005 12.1005C14.726 9.475 18.287 8 22 8C22.5304 8 23.0391 7.78929 23.4142 7.41421C23.7893 7.03914 24 6.53043 24 6C24 5.46957 23.7893 4.96086 23.4142 4.58579C23.0391 4.21071 22.5304 4 22 4C17.2261 4 12.6477 5.89642 9.27208 9.27208C5.89643 12.6477 4 17.2261 4 22C4 22.5304 4.21071 23.0391 4.58578 23.4142C4.96086 23.7893 5.46957 24 6 24C6.53043 24 7.03914 23.7893 7.41422 23.4142C7.78929 23.0391 8 22.5304 8 22C8 18.287 9.475 14.726 12.1005 12.1005Z" fill="currentColor"/>
<defs>
<linearGradient id="paint0_linear_1453_55587" x1="11" y1="6.5" x2="34.5" y2="35" gradientUnits="userSpaceOnUse">
<stop stop-color="#363D43"/>
<stop offset="1" stop-color="currentColor"/>
</linearGradient>
<linearGradient id="paint1_linear_1453_55587" x1="14.1" y1="12.75" x2="21.15" y2="21.3" gradientUnits="userSpaceOnUse">
<stop stop-color="#363D43"/>
<stop offset="1" stop-color="currentColor"/>
</linearGradient>
<linearGradient id="paint2_linear_1453_55587" x1="7.5" y1="5.25" x2="19.25" y2="19.5" gradientUnits="userSpaceOnUse">
<stop stop-color="#363D43"/>
<stop offset="1" stop-color="currentColor"/>
</linearGradient>
</defs>
</svg>
      </div>`:`<svg xmlns="http://www.w3.org/2000/svg" width="${data.style.iconSize}" height="${data.style.iconSize}" fill="currentColor" class="bi bi-chat-left-dots-fill" viewBox="0 0 16 16">
  <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4.414a1 1 0 0 0-.707.293L.854 15.146A.5.5 0 0 1 0 14.793zm5 4a1 1 0 1 0-2 0 1 1 0 0 0 2 0m4 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
</svg>`)}
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
    var wh = document.body.offsetHeight;
    console.log('window height',wh);
    window.electronAPI.windowHeight(wh);


    document.querySelector("#"+_id+" #close").addEventListener("click", function (){
        destroyToast(_id);
    });

    document.getElementById(_id).addEventListener("click",function (e){
        var p = e.target.closest('a');
        console.log(e);
        if(p&&p.dataset.action){
            window.electronAPI.windowClick({action: p.dataset.action, id: p.dataset.id });
        }
    });

    toasts[_id] = {
        id: _id,
        duration: data.duration
    }

    await showToast(_id);
}
async function updateToast(data){
    console.log('updateToast',data)
    let _el = document.querySelector(`#${data.id} .message`);
    _el.innerHTML = data.message;
    _el = document.querySelector(`#${data.id} .header`);
    _el.innerHTML = data.title;
    var wh = document.body.offsetHeight;
    console.log('window height',wh);
    window.electronAPI.windowHeight(wh);
    await showToast(data.id);
}
async function showToast(id){
    document.getElementById(id).classList.add("show");
	if(toasts[id].duration>0){
		await delay(toasts[id].duration);
        await destroyToast(id);
	}
}

async function destroyToast(id){
    console.log('toast destroy',id)
    document.getElementById(id).classList.remove("show");
    document.getElementById(id).classList.add("hide");
    await delay(200);
    delete toasts[id];
    document.getElementById(id).remove();
    var wh = document.body.offsetHeight;
    console.log('window height',wh);
    window.electronAPI.windowHeight(wh);
    window.electronAPI.checkWindowDestroy(Object.keys(toasts).length);
}

function delay(amount){
    return new Promise(resolve => {
        setTimeout(resolve, amount);
    });
}
