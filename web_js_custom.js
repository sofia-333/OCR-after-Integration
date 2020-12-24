function $1(id) {
    return document.querySelector(`#${id}`)
}

function getPos({posX, posY}) {
    if (posX && posY) {
        return {
            posX: posX - $imageLeft,
            posY: posY - $imageTop,
        }
    }
    if (posX) return posX - $imageLeft
    if (posY) return posY - $imageTop
}

function setStyle(obj, style) {
    for (let a in style) {
        obj.style[a] = style[a];
    }
}

function elt(el, cls, id, style) {
    let elm = document.createElement(el)
    if (cls) elm.className = cls;
    if (id) elm.setAttribute('id', id);
    if (style) setStyle(elm, style)
    return elm;
}

function parsePx(px) {
    return parseInt(px.split('px')[0])
}