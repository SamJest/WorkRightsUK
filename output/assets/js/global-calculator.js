(function(){
  const pills = Array.from(document.querySelectorAll(".currency-pill"));
  pills.forEach(btn=>{
    btn.addEventListener("click",function(){
      pills.forEach(x=>x.classList.remove("is-active"));
      btn.classList.add("is-active");
    });
  });
})();
