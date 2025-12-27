let camera, scene, renderer, mesh, group;
const amount = 10;
const count = Math.pow(amount, 2);
const dummy = new THREE.Object3D();

const seeds = [];
const baseColors = [];
const color = new THREE.Color();

// монохромная средне-светлая палитра (без примесей)
// const colors = [
//     new THREE.Color(0x2f2f2f),
//     new THREE.Color(0x2c2c2c),
//     new THREE.Color(0x292929),
//     new THREE.Color(0x252525)
// ];

const colors = [
    new THREE.Color(0x2e2e2e), // глубокий нейтральный серый
    new THREE.Color(0x383838),
    new THREE.Color(0x414141),
    new THREE.Color(0x4a4a4a)
];

const animation = { t: 0 };
let currentColorIndex = 0;
let nextColorIndex = 1;

const maxDistance = 20;

init();

function init() {
    // Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    // Камера
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 15, 10);
    camera.lookAt(0, 0, 0);

    // Сцена
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Свет
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // Геометрия куба (опционально увеличенная)
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('img/edge3.jpg');
    texture.colorSpace = THREE.SRGBColorSpace;

    // const material = new THREE.MeshStandardMaterial({
    //     map: texture,
    //     color: 0xffffff
    // });

    const material = new THREE.MeshStandardMaterial({
        map: texture,
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,  // 0 = полностью прозрачный, 1 = полностью непрозрачный
    });

    // InstancedMesh
    mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    group = new THREE.Group();
    group.add(mesh);

    group.position.set(0, 0, -5);
    group.scale.set(1.5, 1.5, 1.5);

    scene.add(group);

    // Расстановка кубиков
    const spacing = 1.8; // увеличенный шаг для больших кубов
    const offset = (amount - 1) / 2;

    let i = 0;

    for (let x = 0; x < amount; x++) {
        for (let z = 0; z < amount; z++) {

            dummy.position.set(
                (x - offset) * spacing,
                0,
                (z - offset) * spacing
            );

            dummy.scale.set(1, 2, 1);
            dummy.updateMatrix();

            const c = colors[Math.floor(Math.random() * colors.length)];

            // базовый цвет — чисто белый (или можно взять светло-серый)
            baseColors.push(0xffffff);

            mesh.setMatrixAt(i, dummy.matrix);
            mesh.setColorAt(i, c.clone());

            seeds.push(Math.random());
            i++;
        }
    }

    window.addEventListener('resize', onWindowResize);

    setInterval(startTween, 3000);
    animate();
}

function startTween() {
    new TWEEN.Tween(animation)
        .to({ t: 1 }, 2000)
        .easing(TWEEN.Easing.Sinusoidal.In)
        .onComplete(() => {
            animation.t = 0;
            currentColorIndex = nextColorIndex;
            nextColorIndex++;
            if (nextColorIndex >= colors.length) nextColorIndex = 0;
        })
        .start();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001;
    TWEEN.update();

    for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

        dummy.position.y = Math.abs(Math.sin((time + seeds[i]) * 2 + seeds[i]));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        if (animation.t > 0) {
            const currentColor = colors[currentColorIndex];
            const nextColor = colors[nextColorIndex];
            const f = dummy.position.length() / maxDistance;

            if (f <= animation.t) {
                color.copy(nextColor);
            } else {
                color.copy(currentColor);
            }

            mesh.setColorAt(i, color);
        }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (animation.t > 0) mesh.instanceColor.needsUpdate = true;

    group.rotation.y = time * 0.2;

    renderer.render(scene, camera);
}

// слайдер

document.addEventListener("DOMContentLoaded", () => {
    const swiper = new Swiper(".video-swiper", {
        slidesPerView: 5,
        spaceBetween: 16,
        navigation: {
            nextEl: ".recall-section__title-block #right",
            prevEl: ".recall-section__title-block #left",
        },
        breakpoints: {
            0: { slidesPerView: 1.2 },
            768: { slidesPerView: 3 },
            1200: { slidesPerView: 5 },
        },
        loop: true,
    });

    const swiperEl = document.querySelector(".video-swiper");

    if (!swiperEl) return;

    const lightbox = document.querySelector(".lightbox");

    if (!lightbox) return;

    const lightboxVideo = lightbox.querySelector("video");
    const closeBtn = lightbox.querySelector(".lightbox__close-btn");

    //отладочное - без добавления .lightbox__close-btn НЕ РАБОТАЕТ
    if (!lightboxVideo || !closeBtn) return;

    const openLightbox = async (videoEl) => {
        const src =
            videoEl.dataset.video ||
            videoEl.currentSrc ||
            videoEl.src;

        if (!src) return;

        lightboxVideo.src = src;
        lightbox.classList.add('active');

        try {
            await lightboxVideo.play();
        } catch (_) { }
    };

    const closeLightbox = () => {
        lightboxVideo.pause();
        lightboxVideo.removeAttribute("src");
        lightboxVideo.load();
        lightbox.classList.remove('active');
    };

    // Делегирование кликов ДЛЯ ВСЕХ video-card
    swiperEl.addEventListener("click", (e) => {
        const card = e.target.closest(".video-card");
        if (!card || !swiperEl.contains(card)) return;


        const preview = card.querySelector(".video-preview");
        if (!preview) return;

        // предотвращаем лишние действия кнопок/оверлея
        e.preventDefault();

        openLightbox(preview);
    });

    // Закрытие только по кнопке
    closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeLightbox();
    });
});


document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".cases-nav__item");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            // убрать active со всех элементов
            navItems.forEach(i => i.classList.remove("active"));
            // добавить active к текущему
            item.classList.add("active");
        });
    });
});


document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".cases-nav__item");
    const cards = document.querySelectorAll(".cases__card");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            const filterId = item.id;

            cards.forEach(card => {
                if (filterId === "all" || card.classList.contains(filterId)) {
                    card.classList.remove("hidden");
                } else {
                    card.classList.add("hidden");
                }
            });
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const openSurveyButtons = document.querySelectorAll('.open-survey-btn');
    const surveyModal = document.querySelector('.survey-modal');
    const closeSurveyBtn = document.querySelector('.survey-modal .lightbox__close-btn');

    if (openSurveyButtons.length && surveyModal && closeSurveyBtn) {
        openSurveyButtons.forEach(button => {
            button.addEventListener('click', () => {
                surveyModal.classList.add('active');
            });
        });

        closeSurveyBtn.addEventListener('click', () => {
            surveyModal.classList.remove('active');
        });
    }

    const openRequestButtons = document.querySelectorAll('.open-request-btn');
    const requestModal = document.querySelector('.request-modal ');
    const closeRequestBtn = document.querySelector('.request-modal .lightbox__close-btn');

    if (openRequestButtons.length && requestModal && closeRequestBtn) {
        openRequestButtons.forEach(button => {
            button.addEventListener('click', () => {
                requestModal.classList.add('active');
            });
        });

        closeRequestBtn.addEventListener('click', () => {
            requestModal.classList.remove('active');
        });
    }

    document.querySelectorAll('.custom-select').forEach(select => {
        const trigger = select.querySelector('.custom-select__trigger');
        const value = select.querySelector('.custom-select__value');
        const options = select.querySelectorAll('.custom-select__list li');

        trigger.addEventListener('click', () => {
            select.classList.toggle('open');
        });

        options.forEach(option => {
            option.addEventListener('click', () => {
                value.textContent = option.textContent;
                trigger.classList.add('active');
                select.classList.remove('open');
            });
        });

        document.addEventListener('click', e => {
            if (!select.contains(e.target)) {
                select.classList.remove('open');
            }
        });
    });

});

document.addEventListener('DOMContentLoaded', () => {
    const btnContainer = document.querySelector('.btn-container');
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuButton = document.querySelector('.additional-menu-button');

    if (!btnContainer || !mobileMenu || !menuButton) return;

    btnContainer.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
        menuButton.classList.toggle('open');
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.costs-checkboxes__item');
    const casesBlocks = document.querySelectorAll('.costs-cases');

    if (!tabs.length || !casesBlocks.length) return;

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const id = tab.id;
            if (!id) return;

            // 1) Активный таб
            tabs.forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');

            // 2) Активный блок кейсов
            casesBlocks.forEach((block) => block.classList.remove('active'));

            const target = document.querySelector(`.costs-cases.${CSS.escape(id)}`);
            if (target) target.classList.add('active');
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.dev-cases .cases-nav__item');
    const casesBlocks = document.querySelectorAll('.dev-cases .cases-slider');

    if (!tabs.length || !casesBlocks.length) return;

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const id = tab.id;
            if (!id) return;

            // 1) Активный таб
            tabs.forEach((t) => t.classList.remove('visible'));
            tab.classList.add('visible');

            // 2) Активный блок кейсов
            casesBlocks.forEach((block) => block.classList.remove('visible'));

            const target = document.querySelector(`.dev-cases .cases-slider.${CSS.escape(id)}`);
            if (target) target.classList.add('visible');
        });
    });
});

// СЛАЙДЕР НА СТРАНИЧКЕ РАЗРАБОТКИ

document.addEventListener('DOMContentLoaded', () => {
    if (typeof Swiper === 'undefined') return;

    const section = document.querySelector('.dev-cases');
    if (!section) return;

    const navItems = Array.from(section.querySelectorAll('.cases-nav__item'));
    const sliders = Array.from(section.querySelectorAll('.cases-slider'));

    const swipers = new Map();

    function initSlider(sliderEl) {
        if (swipers.has(sliderEl)) return swipers.get(sliderEl);

        // Swiper контейнеру нужен класс "swiper"
        sliderEl.classList.add('swiper');

        const prevEl = sliderEl.querySelector('.nav-block__btn-left');
        const nextEl = sliderEl.querySelector('.nav-block__btn-right');

        const swiper = new Swiper(sliderEl, {
            slidesPerView: 1,
            loop: true,
            speed: 700,
            autoHeight: true,
            watchOverflow: true,
            allowTouchMove: true,

            effect: 'fade',
            fadeEffect: {
                crossFade: false // текущий исчез, потом появился следующий
            },

            navigation: {
                prevEl,
                nextEl,
            },

            on: {
                // важно: при fade иногда нужно принудительно обновить высоту
                slideChangeTransitionEnd() {
                    this.updateAutoHeight(0);
                }
            }
        });



        swipers.set(sliderEl, swiper);
        return swiper;
    }

    // Инициализируем все слайдеры
    sliders.forEach(initSlider);

    // Переключение табов
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const id = item.id;
            if (!id) return;

            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            sliders.forEach(sliderEl => {
                const isTarget = sliderEl.classList.contains(id);
                sliderEl.classList.toggle('visible', isTarget);

                if (isTarget) {
                    const swiper = initSlider(sliderEl);
                    swiper.update();
                    // если при смене таба всегда нужен 1-й слайд:
                    swiper.slideTo(0, 0);
                }
            });
        });
    });

    // На старте обновим видимый
    const initial = sliders.find(s => s.classList.contains('visible')) || sliders[0];
    if (initial) {
        const swiper = initSlider(initial);
        swiper.update();
    }
});

