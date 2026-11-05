(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.navigation');

  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
      navigation.classList.toggle('open', !isOpen);
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Abrir menu');
        navigation.classList.remove('open');
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navigation.classList.contains('open')) {
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Abrir menu');
        navigation.classList.remove('open');
        menuButton.focus();
      }
    });
  }

  const search = document.querySelector('#service-search');
  const groups = [...document.querySelectorAll('.service-group')];
  const emptyState = document.querySelector('#search-empty');
  if (search) {
    search.addEventListener('input', () => {
      const query = search.value.trim().toLocaleLowerCase('pt-BR');
      let visibleCount = 0;
      groups.forEach((group) => {
        let groupCount = 0;
        group.querySelectorAll('[data-service-card]').forEach((item) => {
          const matches = !query || item.textContent.toLocaleLowerCase('pt-BR').includes(query);
          item.closest('li').hidden = !matches;
          if (matches) groupCount += 1;
        });
        group.hidden = groupCount === 0;
        visibleCount += groupCount;
      });
      if (emptyState) emptyState.hidden = visibleCount !== 0;
    });
  }

  const serviceDialog = document.querySelector('#service-dialog');
  const dialogTitle = document.querySelector('#service-dialog-title');
  const dialogCategory = document.querySelector('#service-dialog-category');
  const dialogContent = document.querySelector('#service-dialog-content');
  const serviceItems = new Map();
  let serviceDataPromise;

  function loadServiceData() {
    if (!serviceDataPromise) {
      serviceDataPromise = fetch('service-content.json')
        .then((response) => {
          if (!response.ok) throw new Error('Não foi possível carregar as informações dos serviços.');
          return response.json();
        })
        .then((items) => {
          items.forEach((item) => serviceItems.set(item.id, item));
          return serviceItems;
        });
    }
    return serviceDataPromise;
  }

  function appendServiceBlock(block) {
    if (block.type === 'heading') {
      const heading = document.createElement('h3');
      heading.textContent = block.text;
      dialogContent.append(heading);
      return;
    }

    if (block.type === 'list') {
      const list = document.createElement('ul');
      block.items.forEach((text) => {
        const item = document.createElement('li');
        item.textContent = text;
        list.append(item);
      });
      dialogContent.append(list);
      return;
    }

    const paragraph = document.createElement('p');
    paragraph.textContent = block.text;
    dialogContent.append(paragraph);
  }

  async function showServiceDetails(button) {
    if (!serviceDialog || !dialogTitle || !dialogCategory || !dialogContent) return;

    const serviceId = button.dataset.serviceId;
    const title = button.querySelector('.service-link-label')?.textContent.trim() || 'Informações do serviço';
    const serviceGroup = button.closest('.service-group');
    const groupTitle = serviceGroup?.querySelector('h3')?.textContent.trim() || 'Serviços';

    dialogTitle.textContent = title;
    dialogCategory.textContent = groupTitle;
    dialogContent.replaceChildren();
    const loading = document.createElement('p');
    loading.className = 'service-dialog-loading';
    loading.textContent = 'Carregando as informações…';
    dialogContent.append(loading);

    if (!serviceDialog.open) serviceDialog.showModal();

    try {
      const data = await loadServiceData();
      const service = data.get(serviceId);
      dialogContent.replaceChildren();
      if (!service || !service.blocks?.length) {
        const fallback = document.createElement('p');
        fallback.className = 'service-dialog-error';
        fallback.textContent = 'As informações detalhadas não estão disponíveis no momento. Entre em contato com o cartório para receber orientação.';
        dialogContent.append(fallback);
        return;
      }
      service.blocks.forEach(appendServiceBlock);
    } catch (error) {
      dialogContent.replaceChildren();
      const fallback = document.createElement('p');
      fallback.className = 'service-dialog-error';
      fallback.textContent = 'Não foi possível carregar as informações. Tente novamente ou entre em contato com o cartório.';
      dialogContent.append(fallback);
    }
  }

  document.querySelectorAll('.service-link[data-service-id]').forEach((button) => {
    button.addEventListener('click', () => showServiceDetails(button));
  });

  document.querySelectorAll('[data-close-service-dialog]').forEach((button) => {
    button.addEventListener('click', () => serviceDialog?.close());
  });

  if (serviceDialog) {
    serviceDialog.addEventListener('click', (event) => {
      if (event.target === serviceDialog) serviceDialog.close();
    });
  }

  document.querySelectorAll('.question-list details').forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        document.querySelectorAll('.question-list details').forEach((other) => {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  const year = document.querySelector('#current-year');
  if (year) year.textContent = String(new Date().getFullYear());

  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('.nav-link[href^="#"]')];
  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      const inView = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!inView) return;
      navLinks.forEach((link) => {
        const active = link.hash === `#${inView.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-28% 0px -62% 0px', threshold: [0, .05, .2] });
    sections.forEach((section) => observer.observe(section));
  }
})();
