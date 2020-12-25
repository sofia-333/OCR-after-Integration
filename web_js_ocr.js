const docImage = document.getElementsByClassName("doc-image")[0];

let $imageLeft = 0;
let $imageTop = 0;


docImage.onload = () => {

  const submitButton = document.getElementById("submitButton");
  const undoButton = document.getElementById("undoButton");
  const redoButton = document.getElementById("redoButton");
  const deleteButton = document.getElementById("deleteButton");
  const container = document.getElementsByClassName("container")[0];
  let posX, posY, newDiv, x1, y1, divHeight, divWidth, divLayer, outerDiv, divNumber = 0, dropdown;
  let dragBtnParent, moved = true, dragPosX, dragPosY, oldDragPosX, oldDragPosY, isResizing, selected = true;
  const dataToSend = [], undoStack = new Stack(), redoStack = new Stack();
  let currentResizer, currentDropdown, currentDiv, currentDelete, currentDrag, prevX, prevY, outerDivCopy, before_after = [];
  const maxImageSize = 1000;
  let imageK = 1;

  if (docImage.width > maxImageSize) {
    imageK = docImage.width / maxImageSize
    docImage.width = maxImageSize
  }
  setTimeout(() => {
    $(docImage).removeClass('d-none')
  }, 50)
  $('#image-loader').remove()

  setStyle(docImage, {
    userSelect: 'none',
  })

  $(docImage).on('contextmenu', (e) => e.preventDefault())

  // div which will be covering the image

  createDivLayer(docImage);

  $(divLayer).on('mousedown', (e) => {

    if (e.button === 2 || e.which === 3) {
      return
    }

    $imageLeft = $(docImage).offset().left
    $imageTop = $(docImage).offset().top

    posX = e.pageX
    posY = e.pageY
    //coordinates relative to image(coordinates to send)
    x1 = getPos({ posX }) - docImage.x;
    y1 = getPos({ posY }) - docImage.y;
    newDiv = elt('div', 'new-div')
    //creating div,which will contain 1.new red div 2.delete button
    createOuterDiv(newDiv);
    registerEvents(e)
  });

  function registerEvents(ev) {
    $(document.body).on('mousemove', onMouseMove);
    $(document.body).on('mouseup', onMouseUp);

    function onMouseMove(e) {
      divWidth = e.pageX - posX;
      divHeight = e.pageY - posY;
      setStyle(newDiv, {
        width: divWidth + 'px',
        height: divHeight + 'px',
      })
    }

    function onMouseUp(e) {
      let width = parsePx(newDiv.style.height);
      let height = parsePx(newDiv.style.width);

      if (width >= 10 && height >= 10) {
        createNewDiv(e)
      } else {
        $(newDiv).parent().remove()
      }
      $(document.body).off('mousemove', onMouseMove)
      $(document.body).off('mouseup', onMouseUp)
    }

    function createNewDiv(e) {
      createDropdown(newDiv);
      //deleting
      createDeleteButton(outerDiv);
      //dragging
      createDragButton(outerDiv);
      //resizing
      createResizePoints(newDiv);

      redoStack.clear();
      let _outerDivCopy = outerDiv.cloneNode();
      _outerDivCopy.innerHTML = outerDiv.innerHTML;
      undoStack.push([0, 0, _outerDivCopy, dropdown.selectedIndex]);
    }
  }

  setTimeout(() => {
    $(undoButton).on('click', undo);
    $(redoButton).on('click', redo);
    $(submitButton).on('click', (e) => sendData());
  }, 200)


  function createDivLayer(docImage) {
    divLayer = document.getElementsByClassName("div-layer")[0];
    setStyle(divLayer, {
      width: docImage.width + 'px',
      height: docImage.height + 'px',
      userSelect: 'none',
    })
    divLayer.x = docImage.x;
    divLayer.y = docImage.y;
  }


  function createOuterDiv(newDiv) {
    outerDiv = elt('div', 'outer-div', `outerDiv${++divNumber}`, {
      left: getPos({ posX }) + 'px',
      top: getPos(({ posY })) + 'px',
      userSelect: 'none',
    })
    outerDiv.appendChild(newDiv);
    container.appendChild(outerDiv);
  }


  function createDropdown(newDiv) {
    dropdown = elt('select', 'dropdown', null, {
      width: divWidth + 'px',
      height: divHeight + 'px',
      userSelect: 'none',
    })
    for (let i = 0; i < 3; i++) {
      let option = new Option;
      option.text = `something ${i}`;
      option.value = `value${i}`;
      dropdown.append(option)
    }
    newDiv.appendChild(dropdown);
    saveSelectCurrentIndexes(newDiv);
  }


  function createDeleteButton(outerDiv) {
    const deleteButton = elt('button', 'delete-button', null, {
      left: divWidth + 1 + 'px',
      top: -5 + 'px',
      userSelect: 'none',
    })
    deleteButton.innerText = 'x'

    $(deleteButton).on('click', onDivRemove)
    outerDiv.appendChild(deleteButton);
  }


  function onDivRemove(e) {
    let _outerDivCopy = e.target.parentElement.cloneNode();
    _outerDivCopy.innerHTML = e.target.parentElement.innerHTML;
    container.removeChild(_outerDivCopy);
    let _dropDownCopy = _outerDivCopy.firstChild.firstChild;
    redoStack.clear();
    undoStack.push([_outerDivCopy, _dropDownCopy.selectedIndex,0, 0]);
  }

  function createDragButton(outerDiv) {
    const dragButton = elt('button', 'drag-button', null, {
      left: divWidth + 1 + 'px',
      top: -5 + 'px',
    })
    //drag icon
    const i = elt('i', 'fas fa-arrows-alt')
    dragButton.appendChild(i);

    $(dragButton).on('mousedown', (e) => {
      dragMousedown(e, outerDiv);
    });

    outerDiv.appendChild(dragButton);
  }


  function dragMousedown(e, parent) {
    let lastChild = parent.parentNode.lastChild.nextSibling;
    parent.parentNode.insertBefore(parent, lastChild);

    oldDragPosX = e.pageX;
    oldDragPosY = e.pageY;

    dragBtnParent = parent

    let _dropDownCopy = dragBtnParent.getElementsByClassName("new-div")[0].firstChild;
    before_after = [];
    before_after[0] = dragBtnParent.cloneNode();
    before_after[0].innerHTML = dragBtnParent.innerHTML;
    before_after[1] = _dropDownCopy.selectedIndex;

    $(document.body).on('mousemove', dragMousemove);
    $(document.body).on('mouseup', dragMouseup);

  }

  function dragMousemove(e) {
    dragPosX = oldDragPosX - e.pageX;
    dragPosY = oldDragPosY - e.pageY;
    oldDragPosX = e.pageX;
    oldDragPosY = e.pageY;
    dragBtnParent.style.left = dragBtnParent.offsetLeft - dragPosX + "px";
    dragBtnParent.style.top = dragBtnParent.offsetTop - dragPosY + "px";
  }


  function dragMouseup(e) {
    let _dropDownCopy = dragBtnParent.getElementsByClassName("new-div")[0].firstChild;
    before_after[2] = dragBtnParent.cloneNode();
    before_after[2].innerHTML = dragBtnParent.innerHTML;
    before_after[3] = _dropDownCopy.selectedIndex;
    //checking if it really changed the position
    if (before_after[0].style.top !== before_after[2].style.top || before_after[0].style.left !== before_after[2].style.left) {
      redoStack.clear();
      undoStack.push(before_after);
    }
    $(document.body).off('mousemove', dragMousemove);
    $(document.body).off('mouseup', dragMouseup);
  }


  function createResizePoints(newDiv) {
    let res_se = elt('div', 'resizers se');
    $(res_se).on("mousedown", resizeMousedown);
    newDiv.appendChild(res_se);
  }

  function resizeMousedown(e) {
    currentResizer = e.target;
    currentDiv = currentResizer.parentElement;
    currentDropdown = currentDiv.firstChild;
    currentDrag = currentDiv.parentNode.lastChild
    currentDelete = currentDrag.previousSibling
    isResizing = true;
    prevX = e.pageX;
    prevY = e.pageY;

    before_after = [];
    before_after[0] = currentDiv.parentElement.cloneNode();
    before_after[0].innerHTML = currentDiv.parentElement.innerHTML;
    before_after[1] = currentDropdown.selectedIndex;

    $(document.body).on("mousemove", resizeMousemove);
    $(document.body).on("mouseup", resizeMouseup);
  }


  function resizeMousemove(e) {
    const divToResize = currentDiv.getBoundingClientRect();
    seResize(e, divToResize);
    prevX = e.pageX;
    prevY = e.pageY;
  }


  function resizeMouseup(e) {
    isResizing = false;
    before_after[2] = currentDiv.parentElement.cloneNode();
    before_after[2].innerHTML = currentDiv.parentElement.innerHTML;
    before_after[3] = currentDropdown.selectedIndex;
    if (before_after[0] !== before_after[2]) { //checking if it really changed the position
      redoStack.clear();
      undoStack.push(before_after);
    }

    $(document.body).off("mousemove", resizeMousemove);
    $(document.body).off("mouseup", resizeMouseup);
  }


  function seResize(e, divToResize) {
    currentDiv.style.width = currentDropdown.style.width = divToResize.width - (prevX - e.pageX) - 2 + "px";
    currentDiv.style.height = currentDropdown.style.height = divToResize.height - (prevY - e.pageY) - 2 + "px";

    currentDelete.style.left = currentDrag.style.left = divToResize.width + 1 + (prevX - e.pageX) + "px";
    currentDelete.style.top = currentDrag.style.top = -5 - (prevY - e.pageY) + "px";
  }


  function saveSelectCurrentIndexes(current_newDivCopy) {
    let _newDivCopy = current_newDivCopy;
    _newDivCopy.onmousedown = e => {
      let _dropdownCopy = e.target;
      let _newDivCopy = _dropdownCopy.parentElement;
      let _outerDivCopy = _newDivCopy.parentElement;

      before_after = [];
      before_after[0] = _outerDivCopy.cloneNode();
      before_after[0].innerHTML = _outerDivCopy.innerHTML;
      before_after[1] = _dropdownCopy.selectedIndex;//remember index of selected option dropdown before change
      saveSelectChangedIndexes(_dropdownCopy);
    };
  }


  function saveSelectChangedIndexes(current_dropdownCopy) {
    current_dropdownCopy.onchange = e => {
      let _dropdownCopy = e.target;
      let _newDivCopy = _dropdownCopy.parentElement;
      let _outerDivCopy = _newDivCopy.parentElement;

      before_after[2] = _outerDivCopy.cloneNode();
      before_after[2].innerHTML = _outerDivCopy.innerHTML;
      before_after[3] = _dropdownCopy.selectedIndex;//remember index of selected option dropdown after change
      redoStack.clear();
      undoStack.push(before_after);
    }
  }

  function recoverEvents(_outerDiv) {
    const _newDiv = _outerDiv.firstChild;
    const _dragButton = _outerDiv.lastChild;
    const _deleteButton = _dragButton.previousSibling;
    const _resizers = _newDiv.lastChild;

    $(_deleteButton).on('click', onDivRemove)

    $(_dragButton).on('mousedown', (e) => {
      dragMousedown(e, _dragButton.parentNode);
    });

    $(_resizers).on('mousedown', resizeMousedown)
  }


  function undo() {
    console.log("undo pressed");
    if (!undoStack.isEmpty()) {
      let poppedElem = undoStack.pop();
      redoStack.push([poppedElem[2], poppedElem[3], poppedElem[0], poppedElem[1]]);

      placeElementFromStackToDocument(poppedElem);
      console.log("undoStack", undoStack);
    }
  }


  function redo() {
    console.log("redo pressed");
    if (!redoStack.isEmpty()) {
      let poppedElem = redoStack.pop();
      undoStack.push([poppedElem[2], poppedElem[3], poppedElem[0], poppedElem[1]]);

      placeElementFromStackToDocument(poppedElem);
      console.log("redoStack", redoStack);
    }
  }


  function placeElementFromStackToDocument(poppedElem) {
    //deleting outer div ,which is in the undoStack, from document
    //remove only if exists(undo after deleting, for example, this element won't exist poppedElem[2] === 0)
    if (poppedElem[2] !== 0) {
      console.log(poppedElem[2])
      container.removeChild(document.getElementById(poppedElem[2].id));
    }
    if (poppedElem[0] !== 0) {
      let _newDivCopy = poppedElem[0].getElementsByClassName("new-div")[0];
      let _dropdownCopy = _newDivCopy.firstChild;
      _dropdownCopy.selectedIndex = poppedElem[1];
      saveSelectCurrentIndexes(_newDivCopy);//adding EventListeners in this function
      container.appendChild(poppedElem[0]);
      recoverEvents(poppedElem[0]);
    }
  }


  function getDataToSend() {
    $('.new-div').each(function () {
      let div_x = $(this).offset().left - $imageLeft;
      let div_y = $(this).offset().top - $imageTop;
      let div_width = $(this).height();
      let div_height = $(this).width();
      let _selectedIndex = $(this).find('select')[0].selectedIndex;

      console.log(div_x, div_y, div_width, div_height, _selectedIndex);

      dataToSend.push([div_x, div_y, div_width, div_height, _selectedIndex]);
    });
  }


  function sendData() {
    getDataToSend();
    console.log(dataToSend);
    //post Request here?
  }


  function $1(id) {
    return document.querySelector(`#${id}`)
  }


  function getPos({ posX, posY }) {
    if (posX && posY) {
      return {
        posX: posX - $imageLeft,
        posY: posY - $imageTop,
      }
    }
    if (posX) return posX - $imageLeft;
    if (posY) return posY - $imageTop;
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

};
docImage.src = "doc1.jpg";