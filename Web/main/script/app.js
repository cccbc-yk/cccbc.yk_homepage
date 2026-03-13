// タイムボタンを更新する関数
function updateTime(){

const now = new Date()

let h = now.getHours().toString().padStart(2,'0')
let m = now.getMinutes().toString().padStart(2,'0')
let s = now.getSeconds().toString().padStart(2,'0')

document.getElementById("timeButton").innerText = h + ":" + m + ":" + s

}

updateTime()

setInterval(updateTime,1000)


// ハンバーガーメニューのトグル
const hamburger = document.getElementById("hamburger")

hamburger.addEventListener("click",function(){

hamburger.classList.toggle("active")

})


// メニューパネルのトグル
const menuPanel = document.getElementById("menuPanel")

hamburger.addEventListener("click",function(){

menuPanel.classList.toggle("open")

})