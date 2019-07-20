(() => {
  // const { Quill } = require('quill');
  const defaultHeaders = {
    'csrf-token': document.head.querySelector('meta[name="_csrf"]').content
    // 'content-type': 'application/json'
  };
  const rootEl = document.body;
  const log = console.log;
  const submitContentBtn = rootEl.querySelector(
    'button[name="submit-content"]'
  );
  const editor = new Quill('#editor', {
    theme: 'snow'
  });
  const editorData = { content: '' };
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

    log(savedData);

    await get_editor_data();
  };

  const get_editor_data = async () => {
    const res = await fetch(`api/posts/${savedData.id}`, {
      method: 'GET',
      headers: { ...defaultHeaders }
    });

    log(res);
  };

  editor.on('text-change', (delta, oldDelta, source) => {
    const parentEl = document.createElement('div');

    for (const { insert, attributes } of editor.getContents().ops) {
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

      log(parentEl.innerHTML);
    }

    log(editor.getContents());

    editorData.content = parentEl.innerHTML;
  });

  submitContentBtn.onclick = e => save_editor_data();
})();
