const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), index * 80);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));

const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');

toggle?.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});

const gallery = document.querySelector('.life-gallery');
if (gallery) {
  const track = gallery.querySelector('.life-gallery-track');
  const slides = [...track.querySelectorAll('.life-gallery-slide')];
  const thumbs = gallery.querySelector('.life-thumbnails');
  const currentIndex = () => Math.round(track.scrollLeft / track.clientWidth);
  const fitCurrentSlide = () => {
    const slide = slides[currentIndex()];
    if (slide) track.style.height = `${slide.offsetHeight}px`;
  };
  track.addEventListener('scroll', fitCurrentSlide);
  track.addEventListener('load', fitCurrentSlide, true);
  window.addEventListener('resize', fitCurrentSlide);
  fitCurrentSlide();
  window.addEventListener('load', () => {
    const target = slides.find((slide) => `#${slide.id}` === location.hash);
    if (target) {
      track.scrollLeft = target.offsetLeft - slides[0].offsetLeft;
      fitCurrentSlide();
    }
  }, { once: true });
  const show = (index) => {
    const next = Math.max(0, Math.min(index, slides.length - 1));
    if (next === currentIndex()) return false;
    track.scrollTo({ left: slides[next].offsetLeft - slides[0].offsetLeft });
    const thumb = thumbs?.children[next];
    if (thumb) thumbs.scrollLeft = thumb.offsetLeft - thumbs.children[0].offsetLeft - (thumbs.clientWidth - thumb.clientWidth) / 2;
    return true;
  };

  document.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable) return;
    if (show(currentIndex() + (event.key === 'ArrowRight' ? 1 : -1))) event.preventDefault();
  });

  let lastWheel = 0;
  track.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const direction = Math.sign(event.deltaY);
    const index = currentIndex();
    if (!direction || index + direction < 0 || index + direction >= slides.length) return;
    event.preventDefault();
    if (Date.now() - lastWheel < 350) return;
    lastWheel = Date.now();
    show(index + direction);
  }, { passive: false });

  thumbs?.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    const before = thumbs.scrollLeft;
    thumbs.scrollLeft += event.deltaY;
    if (thumbs.scrollLeft !== before) event.preventDefault();
  }, { passive: false });
}
