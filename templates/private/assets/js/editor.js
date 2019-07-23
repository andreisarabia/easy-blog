(() => {
  // const { Quill } = require('quill');
  const defaultHeaders = {
    'csrf-token': document.head.querySelector('meta[name="_csrf"]').content
  };
  const rootEl = document.body;
  const submitContentBtn = rootEl.querySelector(
    'button[name="submit-content"]'
  );
  const editor = new Quill('#editor', { theme: 'snow' });
  const editorData = { htmlContent: '', rawQuillData: null };
  const log = console.log;

  let savedData = null;

  const save_editor_data = async () => {
    const res = await fetch('api/posts', {
      method: 'PUT',
      headers: {
        ...defaultHeaders,
        'Content-type': 'application/json'
      },
      body: JSON.stringify(editorData)
    });
    savedData = await res.json();

    await get_editor_data();
  };

  const get_editor_data = async () => {
    const res = await fetch(`api/posts/${savedData.id}`, {
      method: 'GET',
      headers: { ...defaultHeaders }
    });
    const data = await res.json();

    const { content } = editorData.htmlContent;

    log(res);
  };

  editor.on('text-change', (delta, oldDelta, source) => {
    const parentEl = document.createElement('div');
    const quillChanges = editor.getContents().ops;
    
    log(delta);
    log(editor.getContents().ops);

    for (const { insert, attributes } of quillChanges) {
      if (typeof insert !== 'string' || insert === '\n') continue;

      const wrapperSpan = document.createElement('span');

      if (typeof attributes === 'object') {
        if (attributes.bold) {
          wrapperSpan.style.fontWeight = '700';
        }

        if (attributes.italic) {
          wrapperSpan.style.fontStyle = 'italic';
        }

        if (attributes.color) {
          wrapperSpan.style.color = attributes.color;
        }
      }

      wrapperSpan.innerText = insert;

      parentEl.appendChild(wrapperSpan);
    }

    editorData.htmlContent = parentEl.innerHTML;
    editorData.rawQuillData = { ...quillChanges };
  });

  submitContentBtn.onclick = e => save_editor_data();
})();
