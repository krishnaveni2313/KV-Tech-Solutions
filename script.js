// ================= HEADER + UI =================
const header = document.getElementById("siteHeader");
const nav = document.getElementById("nav");
const menuToggle = document.getElementById("menuToggle");
const scrollProgress = document.getElementById("scrollProgress");
const backToTop = document.getElementById("backToTop");
const loader = document.getElementById("loader");

window.addEventListener("load", () => {
  loader.classList.add("loaded");
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".nav a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

// ================= SCROLL =================
const updateScrollUI = () => {
  const scrollTop = window.scrollY;
  const height = document.documentElement.scrollHeight - window.innerHeight;
  const progress = height > 0 ? (scrollTop / height) * 100 : 0;
  scrollProgress.style.width = `${progress}%`;
  header.classList.toggle("scrolled", scrollTop > 28);
  backToTop.classList.toggle("visible", scrollTop > 560);
};

window.addEventListener("scroll", updateScrollUI, { passive: true });
updateScrollUI();

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ================= ANIMATIONS =================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// ================= COUNTER =================
const countElements = document.querySelectorAll("[data-count]");
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    const element = entry.target;
    const target = Number(element.dataset.count);
    const suffix = target === 24 ? "/7" : target === 99 ? "%" : "+";

    let start = performance.now();
    const duration = 1200;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      element.textContent = `${Math.floor(progress * target)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    counterObserver.unobserve(element);
  });
}, { threshold: 0.5 });

countElements.forEach((el) => counterObserver.observe(el));

// ================= PORTFOLIO =================
const filterButtons = document.querySelectorAll(".filters button");
const portfolioCards = document.querySelectorAll(".portfolio-card");

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.dataset.filter;

    portfolioCards.forEach((card) => {
      const show = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("hidden", !show);
    });
  });
});

// ================= MODAL =================
const modal = document.getElementById("portfolioModal");
const closeModal = document.getElementById("closeModal");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");

portfolioCards.forEach((card) => {
  card.addEventListener("click", () => {
    const img = card.querySelector("img");
    modalImage.src = img.src;
    modalTitle.textContent = card.dataset.title;
    modalDescription.textContent = card.dataset.description;
    modal.classList.add("open");
  });
});

closeModal.addEventListener("click", () => modal.classList.remove("open"));

// ================= CONTACT FORM (UNCHANGED) =================
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");
const submitButton = contactForm.querySelector('button[type="submit"]');

const validators = {
  name: (v) => v.trim().length >= 2,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  phone: (v) => /^[+()\d\s-]{8,}$/.test(v),
  service: (v) => v.trim().length > 0,
  message: (v) => v.trim().length >= 10
};

const setFormStatus = (msg, type) => {
  formStatus.textContent = msg;
  formStatus.className = `form-status ${type}`;
};

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(contactForm);
  let isValid = true;

  Object.keys(validators).forEach((field) => {
    const input = contactForm.elements[field];
    const valid = validators[field](formData.get(field) || "");
    input.classList.toggle("field-error", !valid);
    if (!valid) isValid = false;
  });

  if (!isValid) {
    setFormStatus("Fix errors before submit", "error");
    return;
  }

  const payload = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    service: formData.get("service"),
    message: formData.get("message")
  };

  try {
    await fetch("/api/contact-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setFormStatus("Saved successfully", "success");
    contactForm.reset();
  } catch {
    setFormStatus("Error saving", "error");
  }
});

// ================= ⭐ TESTIMONIAL (NEW FEATURE) =================

// 🔥 ADD YOUR SUPABASE KEYS HERE
const supabaseClient = supabase.createClient(
  "https://byhpqrqgjgfwdqwbjmuw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aHBxcnFnamdmd2Rxd2JqbXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODc1OTIsImV4cCI6MjA5Nzk2MzU5Mn0.bztMLTSfaA1GlmZwtKGj0VFNYy9qccrug7ocwNI5TEY"
);

async function loadTestimonials() {

    const { data, error } = await supabaseClient
        .from("testimonials")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const container = document.getElementById("testimonialContainer");

    container.innerHTML = "";

    data.forEach((item) => {

        container.innerHTML += `

<div class="swiper-slide">

<div class="testimonial-card">

<div class="quote">❝</div>

<p class="review">
${item.review}
</p>

<div class="client">

<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=0D8ABC&color=fff">

<div>

<h4>${item.name}</h4>

<span>${item.business_name}</span>

</div>

</div>

</div>

</div>

`;

    });

    new Swiper(".testimonialSwiper", {

        loop: true,

        slidesPerView: 3,

        spaceBetween: 30,

        autoplay: {

            delay: 4000,

            disableOnInteraction: false

        },

        pagination: {

            el: ".swiper-pagination",

            clickable: true

        },

        navigation: {

            nextEl: ".swiper-button-next",

            prevEl: ".swiper-button-prev"

        },

        breakpoints: {

            320: {

                slidesPerView: 1

            },

            768: {

                slidesPerView: 2

            },

            1024: {

                slidesPerView: 3

            }

        }

    });

}

loadTestimonials();

// 🔥 CALL FUNCTION
loadTestimonials();