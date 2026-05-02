function anothaOne() {
  fetch('https://cse2004.com/api/quotes/random')
    .then(response => response.json())
    .then(quote => {
      document.querySelector('h2').textContent = quote.text
      document.querySelector('p').textContent = quote.author

    })
}
const colors = [
  "rgb(250, 235, 215,0.5)",
  "rgba(215, 221, 250, 0.5)",
  "rgba(235, 215, 250, 0.5)",
  "rgba(228, 250, 215, 0.5)"
]
let index = 0;
document.querySelector('button').addEventListener('click', ()=>{
  anothaOne()
  document.body.style.backgroundColor = colors[index]
  index = (index + 1) % colors.length
}
)
anothaOne()
