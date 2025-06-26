$(document).ready(function () {
  let trendingContent = null;
  let recentContent = null;

  /**
   * Génère le HTML pour l'affichage des étoiles
   * @param {number} note - Nombre d'étoiles à afficher
   * @returns {string} HTML des étoiles
   */
  function buildRatingStars(note) {
    let starElements = '';
    for (let index = 0; index < 5; index++) {
      starElements += `<img src="images/star_${
        index < note ? 'on' : 'off'
      }.png" alt="star" width="15px">`;
    }
    return starElements;
  }

  /**
   * Construit le HTML d'une carte vidéo
   * Utilisé pour les carrousels et l'affichage des cours
   * @param {Object} element - Données de la vidéo
   * @returns {string} HTML de la carte
   */
  function buildVideoCard(element) {
    const ratingHTML = buildRatingStars(element.star);
    return `
		<div class="carousel-card col-12 col-sm-6 col-md-6 col-lg-3 d-flex justify-content-center">
		  <div class="card">
			<img src="${element.thumb_url}" class="card-img-top" alt="Video thumbnail">
			<div class="card-img-overlay text-center">
			  <img src="images/play.png" alt="Play" width="64px" class="align-self-center play-overlay">
			</div>
			<div class="card-body">
			  <h5 class="card-title font-weight-bold">${element.title}</h5>
			  <p class="card-text text-muted">${element['sub-title'] || ''}</p>
			  <div class="creator d-flex align-items-center">
				<img src="${
          element.author_pic_url
        }" alt="${element.author}" width="30px" class="rounded-circle">
				<h6 class="pl-3 m-0 main-color">${element.author}</h6>
			  </div>
			  <div class="info pt-3 d-flex justify-content-between">
				<div class="rating">${ratingHTML}</div>
				<span class="main-color">${element.duration}</span>
			  </div>
			</div>
		  </div>
		</div>
	  `;
  }

  /**
   * Fonction pour récupérer les données depuis l'API
   * @param {string} endpoint - URL de l'API
   * @param {Object} queryParams - Paramètres de requête
   * @param {string} errorContainer - Sélecteur du conteneur d'erreur
   * @returns {Promise} Promise avec les données
   */
  function loadApiData(endpoint, queryParams = {}, errorContainer = null) {
    const spinnerElement = $('.loader');

    if (errorContainer) {
      $(errorContainer).empty(); // Vider le contenu précédent
    }

    spinnerElement.show();

    // Encapsuler l'appel AJAX dans une Promise avec délai
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        $.ajax({
          url: endpoint,
          type: 'GET',
          data: queryParams,
        })
          .done((result) => {
            resolve(result); // Résoudre avec la réponse
          })
          .fail((xhr, status, error) => {
            console.error(
              `Échec du chargement depuis ${endpoint} avec params:`,
              queryParams,
              `Erreur: ${status}, ${error}`
            );
            if (errorContainer) {
              $(errorContainer).html(`
              <div class="text-center text-white py-5">
                <p>
                  Une erreur s'est produite lors du chargement.
                  <br>
                  Veuillez réessayer plus tard.
                </p>
              </div>
            `);
            }
            // Rejeter avec un objet correspondant à ce que .catch() attend
            reject({
              xhr,
              status,
              error,
              message: `Échec du chargement depuis ${endpoint}`,
            });
          })
          .always(() => {
            spinnerElement.hide(); // Masquer le spinner après l'appel AJAX
          });
      }, 1000); // Délai d'1 seconde pour voir le spinner
    });
  }

  /**
   * Système de carrousel personnalisé
   * @param {Array} contentList - Liste des éléments à afficher
   * @param {string} containerSelector - Sélecteur du conteneur
   * @param {string} leftBtn - Sélecteur du bouton précédent
   * @param {string} rightBtn - Sélecteur du bouton suivant
   */
  function initializeSlider(contentList, containerSelector, leftBtn, rightBtn) {
    if (!Array.isArray(contentList) || contentList.length === 0) {
      console.error('Aucune donnée à afficher dans le carrousel:', containerSelector);
      // Afficher un message dans le conteneur
      $(containerSelector).html(
        '<p class="text-center text-white col-12">Aucun contenu disponible.</p>'
      );
      $(leftBtn).hide();
      $(rightBtn).hide();
      return;
    }

    const sliderContainer = $(containerSelector);
    // Le conteneur parent du slider
    const viewport = sliderContainer.parent();
    const prevBtn = $(leftBtn);
    const nextBtn = $(rightBtn);
    let activePosition = 0;

    const contentHTML = contentList.map((item) => buildVideoCard(item)).join('');
    sliderContainer.html(contentHTML);

    function refreshSliderDisplay() {
      // S'assurer que les cartes sont rendues avant de calculer la largeur
      const firstItem = sliderContainer.find('.carousel-card:first-child');
      if (!firstItem.length) return;

      const itemWidth = firstItem.outerWidth(true);
      if (itemWidth === 0) return; // Éviter les problèmes si pas encore dans le DOM

      const visibleItems = Math.floor(viewport.width() / itemWidth);
      const maxPosition = Math.max(0, contentList.length - visibleItems);

      activePosition = Math.min(Math.max(activePosition, 0), maxPosition);

      sliderContainer.css(
        'transform',
        `translateX(-${activePosition * itemWidth}px)`
      );

      prevBtn.toggle(activePosition !== 0);
      nextBtn.toggle(
        activePosition !== maxPosition && contentList.length > visibleItems
      );
    }

    prevBtn.off('click').on('click', () => {
      // .off pour éviter les liaisons multiples
      activePosition--;
      refreshSliderDisplay();
    });
    nextBtn.off('click').on('click', () => {
      activePosition++;
      refreshSliderDisplay();
    });

    // Configuration initiale
    // Utiliser un petit délai pour s'assurer que le DOM est prêt
    setTimeout(refreshSliderDisplay, 0);
  }

  /**
   * Affiche les témoignages dans le carrousel Bootstrap
   * @param {Array} testimonials - Liste des témoignages
   */
  function renderTestimonials(testimonials) {
    if (!testimonials || !Array.isArray(testimonials) || testimonials.length === 0) {
      console.error('Aucun témoignage à afficher.');
      $('#carousel-items').html(
        '<p class="text-center text-white">Aucun témoignage disponible pour le moment.</p>'
      );
      return;
    }

    const testimonialsMarkup = testimonials
      .map((testimonial, position) => {
        const isActive = position === 0 ? ' active' : '';
        return `
		  <blockquote class="carousel-item${isActive}">
			<div class="row mx-auto align-items-center">
			  <div class="col-12 col-sm-2 col-lg-2 offset-lg-1 text-center">
				<img src="${testimonial.pic_url}" class="d-block align-self-center" alt="Photo de ${testimonial.name}">
			  </div>
			  <div class="col-12 col-sm-7 offset-sm-2 col-lg-9 offset-lg-0">
				<div class="quote-text">
				  <p class="text-white pr-md-4 pr-lg-5">${testimonial.text}</p>
				  <h4 class="text-white font-weight-bold">${testimonial.name}</h4>
				  <span class="text-white">${testimonial.title}</span>
				</div>
			  </div>
			</div>
		  </blockquote>
		`;
      })
      .join('');

    $('#carousel-items').html(testimonialsMarkup);
  }

  const testimonialsEndpoint = 'https://smileschool-api.hbtn.info/quotes';
  loadApiData(testimonialsEndpoint)
    .then(renderTestimonials)
    .catch((error) => console.error('Erreur lors du chargement des témoignages:', error));

  /**
   * Section des tutoriels populaires
   */
  const trendingTutorialsAPI =
    'https://smileschool-api.hbtn.info/popular-tutorials';
  loadApiData(trendingTutorialsAPI)
    .then((response) => {
      trendingContent = response; // Stocker pour le gestionnaire de redimensionnement
      initializeSlider(
        response,
        '#popular-carousel-track',
        '#popular-prev-button',
        '#popular-next-button'
      );
    })
    .catch((error) => {
      console.error('Erreur lors du chargement des tutoriels populaires:', error);
      // Afficher l'erreur dans le conteneur spécifique
      $('#popular-carousel-track').html(
        '<p class="text-center text-white col-12">Impossible de charger les tutoriels populaires.</p>'
      );
    });

  /**
   * Section des dernières vidéos
   */
  const recentVideosAPI = 'https://smileschool-api.hbtn.info/latest-videos';
  loadApiData(recentVideosAPI)
    .then((response) => {
      recentContent = response; // Stocker pour le gestionnaire de redimensionnement
      initializeSlider(
        response,
        '#latest-carousel-track',
        '#latest-prev-button',
        '#latest-next-button'
      );
    })
    .catch((error) => {
      console.error('Erreur lors du chargement des dernières vidéos:', error);
      $('#latest-carousel-track').html(
        '<p class="text-center text-white col-12">Impossible de charger les dernières vidéos.</p>'
      );
    });

  /**
   * Section des cours
   */
  function showCoursesList(courseData) {
    if (!courseData || !Array.isArray(courseData.courses)) {
      console.error('Données invalides reçues pour les cours.');
      $('#courses-container').html(
        '<p class="text-center text-white">Impossible de charger les cours.</p>'
      );
      $('.video-count').text('0 vidéos');
      return;
    }
    $('.video-count').text(`${courseData.courses.length} vidéos`);
    if (courseData.courses.length === 0) {
      $('#courses-container').html(
        '<p class="text-center text-white py-5">Aucun cours ne correspond à vos critères.</p>'
      );
      return;
    }
    const courseCards = courseData.courses
      .map((course) => buildVideoCard(course))
      .join('');
    $('#courses-container').html(courseCards);
  }

  function refreshCourseDisplay() {
    const searchQuery = $('.search-text-area').val() || '';
    // Récupérer la valeur réelle, pas seulement le texte affiché
    // Pour l'instant, on suppose que le texte est la valeur comme dans le code original
    const selectedTopic = $('.box2 .dropdown-toggle span').text().trim();
    const selectedSort = $('.box3 .dropdown-toggle span').text().trim();

    loadApiData(
      'https://smileschool-api.hbtn.info/courses',
      { q: searchQuery, topic: selectedTopic, sort: selectedSort },
      '#courses-container' // Passer le conteneur pour que loadApiData gère son message d'erreur
    )
      .then(showCoursesList)
      .catch((error) => {
        // loadApiData gère déjà l'affichage d'une erreur dans #courses-container
        console.error('Erreur lors de la mise à jour des cours:', error);
      });
  }

  function setupDropdownMenus() {
    const coursesAPI = 'https://smileschool-api.hbtn.info/courses';
    loadApiData(coursesAPI, {}) // Pas de conteneur d'erreur spécifique nécessaire ici
      .then((apiResponse) => {
        if (!apiResponse || !apiResponse.topics || !apiResponse.sorts) {
          console.error('Données invalides reçues pour les dropdowns.');
          return;
        }
        const formatLabel = (text) =>
          text
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());

        const topicMenu = $('.box2 .dropdown-menu');
        const availableTopics = apiResponse.topics || [];
        topicMenu.html(
          availableTopics
            .map(
              (topic) => `<a class="dropdown-item" href="#">${formatLabel(topic)}</a>`
            )
            .join('')
        );
        if (availableTopics.length > 0) {
          $('.box2 .dropdown-toggle span').text(formatLabel(availableTopics[0]));
        }

        const sortMenu = $('.box3 .dropdown-menu');
        const availableSorts = apiResponse.sorts || [];
        sortMenu.html(
          availableSorts
            .map(
              (sort) => `<a class="dropdown-item" href="#">${formatLabel(sort)}</a>`
            )
            .join('')
        );
        if (availableSorts.length > 0) {
          $('.box3 .dropdown-toggle span').text(formatLabel(availableSorts[0]));
        }

        refreshCourseDisplay(); // Déclencher l'affichage initial des cours
      })
      .catch((error) => console.error('Erreur lors de la configuration des dropdowns:', error));
  }

  // Gestionnaires d'événements pour la section des cours
  $('.search-text-area').on('input', refreshCourseDisplay);

  $('.box2 .dropdown-menu').on('click', '.dropdown-item', function (e) {
    e.preventDefault();
    $('.box2 .dropdown-toggle span').text($(this).text().trim());
    refreshCourseDisplay();
  });

  $('.box3 .dropdown-menu').on('click', '.dropdown-item', function (e) {
    e.preventDefault();
    $('.box3 .dropdown-toggle span').text($(this).text().trim());
    refreshCourseDisplay();
  });

  // Initialiser les dropdowns et charger les cours initiaux
  if ($('.search-text-area').length) {
    // Seulement si on est sur une page avec une section de cours
    setupDropdownMenus();
  }

  /**
   * Mise à jour automatique des carrousels lors du redimensionnement
   */
  let resizeTimeout;
  $(window).on('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      if (trendingContent && $('#popular-carousel-track').length) {
        // Vérifier si l'élément existe
        initializeSlider(
          trendingContent,
          '#popular-carousel-track',
          '#popular-prev-button',
          '#popular-next-button'
        );
      }
      if (recentContent && $('#latest-carousel-track').length) {
        // Vérifier si l'élément existe
        initializeSlider(
          recentContent,
          '#latest-carousel-track',
          '#latest-prev-button',
          '#latest-next-button'
        );
      }
    }, 250); // Délai anti-rebond pour l'événement de redimensionnement
  });
});
