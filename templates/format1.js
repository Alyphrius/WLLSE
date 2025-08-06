

fetch("/").then(response => (response.text())).then(htmlstring =>{
    const parser=new DOMParser()
    const mdoc=parser.parseFromString(htmlstring,'text/html')
    const tbclone=mdoc.getElementById("topbar").cloneNode(true)
    document.body.insertBefore(tbclone,document.body.firstChild)
})
