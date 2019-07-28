(async () => {
  const docRoot = document.body;
  const defaultHeaders = {
    'csrf-token': document.head.querySelector('meta[name="_csrf"]').content
  };

  docRoot.querySelector('nav button#reset-cache').onclick = async e => {
    const res = await fetch('api/reset-templates', {
      method: 'POST',
      headers: defaultHeaders
    });
    if (res.status === 200) {
      console.log(await res.json());
    } else {
      console.error(await res.text());
    }
  };
})();
