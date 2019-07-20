// const { Quill } = require('quill');
const log = console.log;

const editor = new Quill('#editor', {
  theme: 'snow'
});

editor.on('text-change', (delta, oldDelta, source) => {
  const { ops } = editor.getContents();
  let htmlStr = '';

  for (const { insert, attributes } of ops) {
    const wrapperDiv = document.createElement('div');
    if (attributes) {
      if (attributes.bold === true) {
        const b = document.createElement('b');
        wrapperDiv.append(b);
      }

      if (typeof attributes.color === 'string') {
        wrapperDiv.style.color = attributes.color;
      }
    }
    wrapperDiv.innerHTML = insert;
    htmlStr += wrapperDiv.innerHTML;
    log(wrapperDiv);
  }
});

log(editor);
