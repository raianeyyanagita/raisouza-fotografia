// ==========================================================================
// Ráimes Souza — Front-End + Integração com Backend Exclusivo da Fotógrafa
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  let siteData = null;
  let adminToken = localStorage.getItem('raimes_admin_token') || '';
  let currentCategoryFilter = 'todos';

  const getWhatsappNumber = () => siteData?.settings?.whatsapp || '5531995905082';

  // ------------------------------------------------------------------------
  // 1. Navbar Scroll & Menu Mobile
  // ------------------------------------------------------------------------
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  });

  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => navLinks.classList.remove('active'));
    });
  }

  // ------------------------------------------------------------------------
  // 2. Lightbox Modal
  // ------------------------------------------------------------------------
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');

  const openLightbox = (src, alt, caption) => {
    if (!lightbox) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightboxCaption.textContent = caption || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  };

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  const bindGalleryLightbox = () => {
    document.querySelectorAll('#galleryGrid .gallery-item').forEach(item => {
      item.onclick = () => {
        const img = item.querySelector('img');
        const title = item.querySelector('h4')?.textContent || '';
        const tag = item.querySelector('span')?.textContent || '';
        if (img) openLightbox(img.src, img.alt, tag ? `${tag} — ${title}` : title);
      };
    });
  };
  bindGalleryLightbox();

  // ------------------------------------------------------------------------
  // 3. Filtros da Galeria
  // ------------------------------------------------------------------------
  const applyGalleryFilter = (category) => {
    currentCategoryFilter = category;
    const items = document.querySelectorAll('#galleryGrid .gallery-item');
    items.forEach(item => {
      const itemCat = item.getAttribute('data-category');
      if (category === 'todos' || itemCat === category) {
        item.style.display = 'block';
        requestAnimationFrame(() => {
          item.style.opacity = '1';
          item.style.transform = 'scale(1)';
        });
      } else {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.96)';
        setTimeout(() => {
          if (currentCategoryFilter !== 'todos' && itemCat !== currentCategoryFilter) {
            item.style.display = 'none';
          }
        }, 220);
      }
    });
  };

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyGalleryFilter(btn.getAttribute('data-filter'));
    });
  });

  // ------------------------------------------------------------------------
  // 4. Renderização Dinâmica a partir do Backend (/api/site)
  // ------------------------------------------------------------------------
  const formatPriceParts = (priceStr) => {
    const clean = String(priceStr || '').trim();
    const parts = clean.split(',');
    return {
      main: parts[0] || '0',
      cents: parts[1] ? `,${parts[1]}` : ',00'
    };
  };

  const renderSiteFromData = (data) => {
    if (!data) return;
    siteData = data;
    const wa = getWhatsappNumber();

    // Configurações e Textos
    if (data.settings) {
      const s = data.settings;
      const bioEl = document.getElementById('siteBioQuote');
      if (bioEl && s.bioQuote) bioEl.textContent = `“${s.bioQuote.replace(/^[“"]|[”"]$/g, '')}”`;

      const n1 = document.getElementById('noteText1');
      const n2 = document.getElementById('noteText2');
      const n3 = document.getElementById('noteText3');
      if (n1 && s.ensaiosNote1) n1.textContent = s.ensaiosNote1;
      if (n2 && s.ensaiosNote2) n2.textContent = s.ensaiosNote2;
      if (n3 && s.ensaiosNote3) n3.textContent = s.ensaiosNote3;

      const p1 = document.getElementById('payPixVista');
      const p2 = document.getElementById('payPixParcelado');
      const p3 = document.getElementById('payCartao');
      const t1 = document.getElementById('taxaNeocenterText');
      const t2 = document.getElementById('taxaVilaDaSerraText');
      if (p1 && s.paymentPixVista) p1.textContent = s.paymentPixVista;
      if (p2 && s.paymentPixParcelado) p2.textContent = s.paymentPixParcelado;
      if (p3 && s.paymentCartao) p3.textContent = s.paymentCartao;
      if (t1 && s.taxaNeocenter) t1.textContent = s.taxaNeocenter;
      if (t2 && s.taxaVilaDaSerra) t2.textContent = s.taxaVilaDaSerra;
    }

    // Cards de Ensaios
    const ensaiosGrid = document.getElementById('ensaiosPricingGrid');
    if (ensaiosGrid && Array.isArray(data.ensaios)) {
      ensaiosGrid.innerHTML = data.ensaios.map(item => {
        const p = formatPriceParts(item.price);
        const msg = encodeURIComponent(`Olá, Ráimes! Tenho interesse no *${item.title} (R$ ${item.price})*.`);
        return `
          <div class="price-card">
            <span class="price-badge">${item.badge || ''}</span>
            <h4>${item.title || ''}</h4>
            <div class="price-value">R$ ${p.main}<small>${p.cents}</small></div>
            <p class="price-desc">${item.description || ''}</p>
            <a href="https://wa.me/${wa}?text=${msg}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">
              ${item.buttonText || 'Reservar'}
            </a>
          </div>
        `;
      }).join('');
    }

    // Cards de Planos de Parto
    const partoGrid = document.getElementById('partoPricingGrid');
    if (partoGrid && Array.isArray(data.planosParto)) {
      partoGrid.innerHTML = data.planosParto.map(item => {
        const p = formatPriceParts(item.price);
        const msg = encodeURIComponent(`Olá, Ráimes! Gostaria de saber mais sobre o *${item.badge} - ${item.title} (R$ ${item.price})*.`);
        return `
          <div class="price-card ${item.featured ? 'featured' : ''}">
            <span class="price-badge">${item.badge || ''}</span>
            <h4>${item.title || ''}</h4>
            <div class="price-value">R$ ${p.main}<small>${p.cents}</small></div>
            <p class="price-desc">${item.description || ''}</p>
            <a href="https://wa.me/${wa}?text=${msg}" target="_blank" rel="noopener noreferrer" class="btn ${item.featured ? 'btn-primary' : 'btn-outline'}">
              ${item.buttonText || 'Escolher Plano'}
            </a>
          </div>
        `;
      }).join('');
    }

    // Atualiza opções do Select no formulário de WhatsApp com os preços atuais
    const servicoSelect = document.getElementById('servico');
    if (servicoSelect && Array.isArray(data.planosParto) && Array.isArray(data.ensaios)) {
      const options = [
        ...data.planosParto.map(p => `<option value="${p.badge} (${p.title} - R$ ${p.price})">${p.badge} (${p.title} - R$ ${p.price})</option>`),
        ...data.ensaios.map(e => `<option value="${e.title} (R$ ${e.price})">${e.title} (R$ ${e.price})</option>`)
      ];
      servicoSelect.innerHTML = options.join('');
    }

    // Galeria de Fotos do Portfólio
    const galleryGrid = document.getElementById('galleryGrid');
    if (galleryGrid && Array.isArray(data.gallery)) {
      galleryGrid.innerHTML = data.gallery.map(photo => `
        <div class="gallery-item ${photo.size === 'tall' ? 'tall' : ''}" data-category="${photo.category || 'parto'}">
          <img src="${photo.src}" alt="${photo.title || ''}">
          <div class="gallery-overlay">
            <span>${photo.tag || ''}</span>
            <h4>${photo.title || ''}</h4>
          </div>
        </div>
      `).join('');
      bindGalleryLightbox();
      applyGalleryFilter(currentCategoryFilter);
    }

    // Álbuns da YouFocus
    const yfGrid = document.getElementById('youfocusGrid');
    if (yfGrid && Array.isArray(data.youfocusAlbums)) {
      yfGrid.innerHTML = data.youfocusAlbums.map(album => `
        <a href="${album.url}" target="_blank" rel="noopener noreferrer" class="yf-album-card">
          <div class="yf-album-cover">
            <span class="yf-album-tag">${album.tag || 'Galeria Online'}</span>
            <img src="${album.cover}" alt="${album.title || ''}">
          </div>
          <div class="yf-album-body">
            <h4>${album.title || ''}</h4>
            <p>${album.description || ''}</p>
            <span class="yf-album-link">Abrir álbum completo ↗</span>
          </div>
        </a>
      `).join('');
    }
  };

  // Carrega dados da API ao iniciar
  fetch('/api/site')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (data) renderSiteFromData(data);
    })
    .catch(() => {
      // Se aberto via file:// sem servidor, mantém o HTML estático
    });

  // ------------------------------------------------------------------------
  // 5. Envio Direto do Formulário para o WhatsApp da Ráimes
  // ------------------------------------------------------------------------
  const contactForm = document.getElementById('whatsappForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = document.getElementById('nome').value.trim();
      const servico = document.getElementById('servico').value;
      const dataPrevista = document.getElementById('dataPrevista').value.trim();
      const mensagem = document.getElementById('mensagem').value.trim();

      const texto = [
        `Olá, Ráimes! Tudo bem? ✨`,
        `Vim pelo seu site e gostaria de conversar sobre um registro fotográfico.`,
        ``,
        `*Nome:* ${nome}`,
        `*Interesse:* ${servico}`,
        dataPrevista ? `*DPP / Data prevista:* ${dataPrevista}` : null,
        mensagem ? `*Mensagem:* ${mensagem}` : null
      ].filter(Boolean).join('\n');

      const url = `https://wa.me/${getWhatsappNumber()}?text=${encodeURIComponent(texto)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }

  // ------------------------------------------------------------------------
  // 6. Área Restrita da Fotógrafa (Login + Painel de Edição)
  // ------------------------------------------------------------------------
  const openAdminBtn = document.getElementById('openAdminBtn');
  const loginOverlay = document.getElementById('loginOverlay');
  const closeLoginBtn = document.getElementById('closeLoginBtn');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  const dashboardOverlay = document.getElementById('dashboardOverlay');
  const closeDashboardBtn = document.getElementById('closeDashboardBtn');
  const logoutAdminBtn = document.getElementById('logoutAdminBtn');
  const adminStatusMsg = document.getElementById('adminStatusMsg');

  const showStatus = (msg, isError = false) => {
    if (!adminStatusMsg) return;
    adminStatusMsg.textContent = msg;
    adminStatusMsg.style.color = isError ? '#B93838' : '#4A6B57';
    setTimeout(() => {
      if (adminStatusMsg.textContent === msg) adminStatusMsg.textContent = '';
    }, 4500);
  };

  // Popula os campos do Painel Admin com os dados atuais
  const populateDashboardInputs = () => {
    if (!siteData) return;

    // 1. Ensaios
    const ensaiosContainer = document.getElementById('adminEnsaiosList');
    if (ensaiosContainer && Array.isArray(siteData.ensaios)) {
      ensaiosContainer.innerHTML = siteData.ensaios.map((item, idx) => `
        <div class="admin-item-box" data-ensaio-idx="${idx}">
          <h5>${item.title}</h5>
          <div class="form-row">
            <div class="form-group">
              <label>Selo Superior</label>
              <input type="text" class="form-control e-badge" value="${item.badge || ''}">
            </div>
            <div class="form-group">
              <label>Valor (R$)</label>
              <input type="text" class="form-control e-price" value="${item.price || ''}">
            </div>
          </div>
          <div class="form-group">
            <label>Nome do Ensaio</label>
            <input type="text" class="form-control e-title" value="${item.title || ''}">
          </div>
          <div class="form-group">
            <label>Descrição do Pacote</label>
            <textarea class="form-control e-desc" style="min-height: 75px;">${item.description || ''}</textarea>
          </div>
        </div>
      `).join('');
    }

    // 2. Planos de Parto
    const planosContainer = document.getElementById('adminPlanosList');
    if (planosContainer && Array.isArray(siteData.planosParto)) {
      planosContainer.innerHTML = siteData.planosParto.map((item, idx) => `
        <div class="admin-item-box" data-plano-idx="${idx}">
          <h5>${item.badge}</h5>
          <div class="form-row">
            <div class="form-group">
              <label>Nome do Plano (Selo)</label>
              <input type="text" class="form-control p-badge" value="${item.badge || ''}">
            </div>
            <div class="form-group">
              <label>Valor (R$)</label>
              <input type="text" class="form-control p-price" value="${item.price || ''}">
            </div>
          </div>
          <div class="form-group">
            <label>Título Principal</label>
            <input type="text" class="form-control p-title" value="${item.title || ''}">
          </div>
          <div class="form-group">
            <label>O que está incluso</label>
            <textarea class="form-control p-desc" style="min-height: 75px;">${item.description || ''}</textarea>
          </div>
        </div>
      `).join('');
    }

    // 3. Fotos do Portfólio
    const photosGrid = document.getElementById('adminPhotosGrid');
    if (photosGrid && Array.isArray(siteData.gallery)) {
      photosGrid.innerHTML = siteData.gallery.map((photo, idx) => `
        <div class="admin-photo-card" data-photo-idx="${idx}">
          <img src="${photo.src}" alt="${photo.title || ''}">
          <div class="admin-photo-card-body">
            <input type="text" class="form-control ph-tag" value="${photo.tag || ''}" placeholder="Tag" style="padding: 0.45rem 0.65rem; font-size: 0.8rem;">
            <input type="text" class="form-control ph-title" value="${photo.title || ''}" placeholder="Título" style="padding: 0.45rem 0.65rem; font-size: 0.82rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
              <select class="form-control ph-cat" style="padding: 0.4rem; font-size: 0.78rem;">
                <option value="parto" ${photo.category === 'parto' ? 'selected' : ''}>Parto</option>
                <option value="gestante" ${photo.category === 'gestante' ? 'selected' : ''}>Gestante</option>
                <option value="lifestyle" ${photo.category === 'lifestyle' ? 'selected' : ''}>Lifestyle</option>
                <option value="baby" ${photo.category === 'baby' ? 'selected' : ''}>Baby</option>
              </select>
              <button type="button" class="btn-danger-sm remove-photo-btn" data-idx="${idx}">Remover</button>
            </div>
          </div>
        </div>
      `).join('');

      photosGrid.querySelectorAll('.remove-photo-btn').forEach(btn => {
        btn.onclick = () => {
          const i = parseInt(btn.getAttribute('data-idx'), 10);
          siteData.gallery.splice(i, 1);
          populateDashboardInputs();
          showStatus('Foto removida da lista. Clique em "Salvar Todas as Alterações" para confirmar.');
        };
      });
    }

    // 4. Álbuns YouFocus
    const yfList = document.getElementById('adminYoufocusList');
    if (yfList && Array.isArray(siteData.youfocusAlbums)) {
      yfList.innerHTML = siteData.youfocusAlbums.map((album, idx) => `
        <div class="admin-item-box" data-yf-idx="${idx}">
          <h5>
            <span>${album.title || 'Álbum YouFocus'}</span>
            <button type="button" class="btn-danger-sm remove-yf-btn" data-idx="${idx}">Excluir</button>
          </h5>
          <div class="form-row">
            <div class="form-group">
              <label>Título do Álbum</label>
              <input type="text" class="form-control yf-title" value="${album.title || ''}">
            </div>
            <div class="form-group">
              <label>Selo (ex.: Fotografia de Parto)</label>
              <input type="text" class="form-control yf-tag" value="${album.tag || ''}">
            </div>
          </div>
          <div class="form-group">
            <label>Link da Galeria YouFocus</label>
            <input type="text" class="form-control yf-url" value="${album.url || ''}">
          </div>
          <div class="form-group">
            <label>Foto de Capa (URL)</label>
            <input type="text" class="form-control yf-cover" value="${album.cover || ''}">
          </div>
          <div class="form-group">
            <label>Breve Descrição</label>
            <input type="text" class="form-control yf-desc" value="${album.description || ''}">
          </div>
        </div>
      `).join('');

      yfList.querySelectorAll('.remove-yf-btn').forEach(btn => {
        btn.onclick = () => {
          const i = parseInt(btn.getAttribute('data-idx'), 10);
          siteData.youfocusAlbums.splice(i, 1);
          populateDashboardInputs();
        };
      });
    }

    // 5. Configurações & Taxas
    if (siteData.settings) {
      const s = siteData.settings;
      document.getElementById('cfgPixVista').value = s.paymentPixVista || '';
      document.getElementById('cfgPixParcelado').value = s.paymentPixParcelado || '';
      document.getElementById('cfgCartao').value = s.paymentCartao || '';
      document.getElementById('cfgNeocenter').value = s.taxaNeocenter || '';
      document.getElementById('cfgVilaDaSerra').value = s.taxaVilaDaSerra || '';
      document.getElementById('cfgNote1').value = s.ensaiosNote1 || '';
      document.getElementById('cfgNote2').value = s.ensaiosNote2 || '';
      document.getElementById('cfgNote3').value = s.ensaiosNote3 || '';
      document.getElementById('cfgBioQuote').value = s.bioQuote || '';
    }
  };

  // Coleta tudo que a Ráimes digitou nos inputs antes de salvar
  const collectDashboardInputs = () => {
    if (!siteData) return;

    document.querySelectorAll('#adminEnsaiosList .admin-item-box').forEach(box => {
      const idx = parseInt(box.getAttribute('data-ensaio-idx'), 10);
      if (siteData.ensaios[idx]) {
        siteData.ensaios[idx].badge = box.querySelector('.e-badge').value.trim();
        siteData.ensaios[idx].price = box.querySelector('.e-price').value.trim();
        siteData.ensaios[idx].title = box.querySelector('.e-title').value.trim();
        siteData.ensaios[idx].description = box.querySelector('.e-desc').value.trim();
      }
    });

    document.querySelectorAll('#adminPlanosList .admin-item-box').forEach(box => {
      const idx = parseInt(box.getAttribute('data-plano-idx'), 10);
      if (siteData.planosParto[idx]) {
        siteData.planosParto[idx].badge = box.querySelector('.p-badge').value.trim();
        siteData.planosParto[idx].price = box.querySelector('.p-price').value.trim();
        siteData.planosParto[idx].title = box.querySelector('.p-title').value.trim();
        siteData.planosParto[idx].description = box.querySelector('.p-desc').value.trim();
      }
    });

    document.querySelectorAll('#adminPhotosGrid .admin-photo-card').forEach(card => {
      const idx = parseInt(card.getAttribute('data-photo-idx'), 10);
      if (siteData.gallery[idx]) {
        siteData.gallery[idx].tag = card.querySelector('.ph-tag').value.trim();
        siteData.gallery[idx].title = card.querySelector('.ph-title').value.trim();
        siteData.gallery[idx].category = card.querySelector('.ph-cat').value;
      }
    });

    document.querySelectorAll('#adminYoufocusList .admin-item-box').forEach(box => {
      const idx = parseInt(box.getAttribute('data-yf-idx'), 10);
      if (siteData.youfocusAlbums[idx]) {
        siteData.youfocusAlbums[idx].title = box.querySelector('.yf-title').value.trim();
        siteData.youfocusAlbums[idx].tag = box.querySelector('.yf-tag').value.trim();
        siteData.youfocusAlbums[idx].url = box.querySelector('.yf-url').value.trim();
        siteData.youfocusAlbums[idx].cover = box.querySelector('.yf-cover').value.trim();
        siteData.youfocusAlbums[idx].description = box.querySelector('.yf-desc').value.trim();
      }
    });

    if (siteData.settings) {
      siteData.settings.paymentPixVista = document.getElementById('cfgPixVista').value.trim();
      siteData.settings.paymentPixParcelado = document.getElementById('cfgPixParcelado').value.trim();
      siteData.settings.paymentCartao = document.getElementById('cfgCartao').value.trim();
      siteData.settings.taxaNeocenter = document.getElementById('cfgNeocenter').value.trim();
      siteData.settings.taxaVilaDaSerra = document.getElementById('cfgVilaDaSerra').value.trim();
      siteData.settings.ensaiosNote1 = document.getElementById('cfgNote1').value.trim();
      siteData.settings.ensaiosNote2 = document.getElementById('cfgNote2').value.trim();
      siteData.settings.ensaiosNote3 = document.getElementById('cfgNote3').value.trim();
      siteData.settings.bioQuote = document.getElementById('cfgBioQuote').value.trim();
    }
  };

  const openDashboard = () => {
    loginOverlay.classList.remove('open');
    populateDashboardInputs();
    dashboardOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  // Botões "Área da Fotógrafa" (no topo, no rodapé ou via link ?admin)
  const triggerAdminAccess = () => {
    if (adminToken) {
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ action: 'verify' })
      })
        .then(r => r.json())
        .then(res => {
          if (res.valid) openDashboard();
          else {
            adminToken = '';
            localStorage.removeItem('raimes_admin_token');
            loginOverlay.classList.add('open');
          }
        })
        .catch(() => loginOverlay.classList.add('open'));
    } else {
      loginOverlay.classList.add('open');
    }
  };

  if (openAdminBtn) openAdminBtn.addEventListener('click', triggerAdminAccess);
  const openAdminTopBtn = document.getElementById('openAdminTopBtn');
  if (openAdminTopBtn) openAdminTopBtn.addEventListener('click', triggerAdminAccess);

  // Permite abrir direto pelo link http://localhost:3333/?admin ou #admin
  if (window.location.search.includes('admin') || window.location.hash === '#admin') {
    setTimeout(triggerAdminAccess, 250);
  }

  if (closeLoginBtn) closeLoginBtn.addEventListener('click', () => loginOverlay.classList.remove('open'));
  if (closeDashboardBtn) {
    closeDashboardBtn.addEventListener('click', () => {
      dashboardOverlay.classList.remove('open');
      document.body.style.overflow = '';
    });
  }

  // Abas do Dashboard
  document.querySelectorAll('.admin-tab-btn').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-pane').forEach(p => p.classList.remove('active'));
      tabBtn.classList.add('active');
      const target = document.getElementById(tabBtn.getAttribute('data-tab'));
      if (target) target.classList.add('active');
    });
  });

  // Login Submit
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loginError.style.display = 'none';
      const username = document.getElementById('adminUser').value.trim();
      const password = document.getElementById('adminPass').value;

      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password })
      })
        .then(r => r.json())
        .then(res => {
          if (res.success && res.token) {
            adminToken = res.token;
            localStorage.setItem('raimes_admin_token', adminToken);
            document.getElementById('adminPass').value = '';
            openDashboard();
          } else {
            loginError.textContent = res.error || 'Usuário ou senha incorretos.';
            loginError.style.display = 'block';
          }
        })
        .catch(() => {
          loginError.textContent = 'Erro ao conectar com o servidor.';
          loginError.style.display = 'block';
        });
    });
  }

  // Logout
  if (logoutAdminBtn) {
    logoutAdminBtn.addEventListener('click', () => {
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ action: 'logout' })
      }).finally(() => {
        adminToken = '';
        localStorage.removeItem('raimes_admin_token');
        dashboardOverlay.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Upload de Nova Foto ou Adição por Link
  const addPhotoBtn = document.getElementById('addPhotoBtn');
  if (addPhotoBtn) {
    addPhotoBtn.addEventListener('click', () => {
      collectDashboardInputs();
      const fileInput = document.getElementById('newPhotoFile');
      const urlInput = document.getElementById('newPhotoUrl');
      const category = document.getElementById('newPhotoCategory').value;
      const size = document.getElementById('newPhotoSize').value;
      const tag = document.getElementById('newPhotoTag').value.trim() || 'Portfólio Ráimes';
      const title = document.getElementById('newPhotoTitle').value.trim() || 'Registro Especial';

      const pushPhoto = (srcUrl) => {
        siteData.gallery.unshift({
          id: `foto-${Date.now()}`,
          src: srcUrl,
          category,
          tag,
          title,
          size
        });
        fileInput.value = '';
        urlInput.value = '';
        document.getElementById('newPhotoTag').value = '';
        document.getElementById('newPhotoTitle').value = '';
        populateDashboardInputs();
        showStatus('Foto adicionada! Clique em "Salvar Todas as Alterações" para publicar no site.');
      };

      if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = () => {
          showStatus('Enviando foto para o servidor...');
          fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ image: reader.result })
          })
            .then(r => r.json())
            .then(res => {
              if (res.success && res.url) pushPhoto(res.url);
              else showStatus(res.error || 'Erro no upload da imagem.', true);
            })
            .catch(() => showStatus('Falha ao enviar arquivo.', true));
        };
        reader.readAsDataURL(fileInput.files[0]);
      } else if (urlInput.value.trim()) {
        pushPhoto(urlInput.value.trim());
      } else {
        showStatus('Selecione um arquivo de foto ou cole um link de imagem.', true);
      }
    });
  }

  // Adicionar Novo Álbum YouFocus
  const addYoufocusBtn = document.getElementById('addYoufocusBtn');
  if (addYoufocusBtn) {
    addYoufocusBtn.addEventListener('click', () => {
      collectDashboardInputs();
      siteData.youfocusAlbums.push({
        id: `yf-${Date.now()}`,
        tag: 'Galeria Online',
        title: 'Novo Álbum',
        description: 'Entrega completa em alta resolução na YouFocus.',
        cover: 'assets/img/pdf_img_25.jpg',
        url: 'https://delivery.youfocus.com.br/'
      });
      populateDashboardInputs();
      showStatus('Novo álbum adicionado! Preencha o link da YouFocus e clique em Salvar.');
    });
  }

  // Salvar Todas as Alterações no Backend (/api/site)
  const saveAllSiteBtn = document.getElementById('saveAllSiteBtn');
  if (saveAllSiteBtn) {
    saveAllSiteBtn.addEventListener('click', () => {
      collectDashboardInputs();
      saveAllSiteBtn.disabled = true;
      saveAllSiteBtn.textContent = 'Salvando...';

      fetch('/api/site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(siteData)
      })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            renderSiteFromData(res.data || siteData);
            showStatus('✓ Todas as alterações foram salvas e já estão no ar!');
          } else {
            showStatus(res.error || 'Erro ao salvar alterações.', true);
          }
        })
        .catch(() => showStatus('Erro de conexão ao salvar.', true))
        .finally(() => {
          saveAllSiteBtn.disabled = false;
          saveAllSiteBtn.textContent = '✓ Salvar Todas as Alterações no Site';
        });
    });
  }

  // Alterar Login e Senha da Fotógrafa
  const saveCredentialsBtn = document.getElementById('saveCredentialsBtn');
  if (saveCredentialsBtn) {
    saveCredentialsBtn.addEventListener('click', () => {
      const newUsername = document.getElementById('newAdminUser').value.trim();
      const newPassword = document.getElementById('newAdminPass').value;

      fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ action: 'change_credentials', newUsername, newPassword })
      })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            document.getElementById('newAdminPass').value = '';
            showStatus('✓ Seu novo usuário e senha foram salvos com sucesso!');
          } else {
            showStatus(res.error || 'Não foi possível alterar a senha.', true);
          }
        })
        .catch(() => showStatus('Erro ao atualizar credenciais.', true));
    });
  }
});
