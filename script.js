"use strict";

/* ---------- Данные заездов ---------- */

const TRIPS = [
  { date: "2026-09-19", tour: "Чарын и Долина замков", duration: "2 дня", price: 68000, seats: 4 },
  { date: "2026-09-26", tour: "Кольсайские озёра", duration: "3 дня", price: 115000, seats: 6 },
  { date: "2026-10-03", tour: "Алтын-Эмель — Поющий бархан", duration: "2 дня", price: 74000, seats: 8 },
  { date: "2026-10-10", tour: "Мангистау — Бозжыра и Тузбаир", duration: "5 дней", price: 295000, seats: 2 },
  { date: "2026-10-17", tour: "Туркестан и городище Отрар", duration: "3 дня", price: 98000, seats: 10 },
  { date: "2026-10-24", tour: "Затопленный лес Каинды", duration: "1 день", price: 32000, seats: 12 },
  { date: "2026-11-07", tour: "Бурабай и Окжетпес", duration: "3 дня", price: 87000, seats: 9 },
  { date: "2026-11-14", tour: "Чарын и Долина замков", duration: "2 дня", price: 68000, seats: 11 },
  { date: "2026-12-05", tour: "Бурабай зимний", duration: "3 дня", price: 92000, seats: 12 },
  { date: "2026-12-20", tour: "Кольсай зимний", duration: "2 дня", price: 89000, seats: 8 }
];

const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря"];

const WEEKDAYS = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];

const formatPrice = (value) => value.toLocaleString("ru-RU") + "\u00A0₸";

function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    day: `${d} ${MONTHS[m - 1]}`,
    weekday: WEEKDAYS[date.getDay()],
    month: m
  };
}

function seatsLabel(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} место`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} места`;
  return `${n} мест`;
}

/* ---------- Расписание ---------- */

const schedule = document.getElementById("schedule");
const scheduleEmpty = document.getElementById("scheduleEmpty");

function renderSchedule(month) {
  const list = month === "all" ? TRIPS : TRIPS.filter((t) => formatDate(t.date).month === Number(month));
  schedule.innerHTML = list.map((trip) => {
    const d = formatDate(trip.date);
    return `
      <div class="trip">
        <div class="trip__date">${d.day}<span>${d.weekday}</span></div>
        <div class="trip__name">${trip.tour}</div>
        <div class="trip__duration">${trip.duration}</div>
        <div class="trip__seats${trip.seats <= 4 ? " is-low" : ""}">осталось ${seatsLabel(trip.seats)}</div>
        <div class="trip__price">${formatPrice(trip.price)}</div>
        <button class="btn btn--small" data-tour="${trip.tour}" data-date="${trip.date}">Забронировать</button>
      </div>`;
  }).join("");

  scheduleEmpty.hidden = list.length > 0;
}

renderSchedule("all");

document.getElementById("filters").addEventListener("click", (event) => {
  const button = event.target.closest(".filter");
  if (!button) return;
  document.querySelectorAll(".filter").forEach((el) => el.classList.toggle("is-active", el === button));
  renderSchedule(button.dataset.month);
});

/* ---------- Список дат в форме ---------- */

const dateSelect = document.getElementById("date");
dateSelect.innerHTML = '<option value="">Гибкие даты</option>' + TRIPS.map((trip) => {
  const d = formatDate(trip.date);
  return `<option value="${trip.date}">${d.day} — ${trip.tour}</option>`;
}).join("");

/* ---------- Кнопки «Забронировать» ---------- */

const tourSelect = document.getElementById("tour");

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-tour]");
  if (!button) return;

  const tour = button.dataset.tour;
  const option = Array.from(tourSelect.options).find((opt) => opt.value === tour || opt.text === tour);
  if (option) tourSelect.value = option.value || option.text;

  if (button.dataset.date) {
    const dateOption = Array.from(dateSelect.options).find((opt) => opt.value === button.dataset.date);
    if (dateOption) dateSelect.value = dateOption.value;
  }

  document.getElementById("request").scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => document.getElementById("name").focus({ preventScroll: true }), 500);
});

/* ---------- Телефон: состояние хранит только цифры ---------- */

const phoneInput = document.getElementById("phone");
let phoneDigits = "";
let seeded = false; // в поле стоит только автоматический префикс «+7 (»

// Приводит произвольный ввод к чистым цифрам вида 7XXXXXXXXXX.
// smart = true для вставки и автозаполнения: там номер может прийти без кода страны.
function normalizePhone(raw, smart) {
  let digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("8")) digits = "7" + digits.slice(1);
  if (smart && digits.length === 10 && !digits.startsWith("77")) digits = "7" + digits;
  if (digits && digits[0] !== "7") digits = "7" + digits;
  return digits.slice(0, 11);
}

// Форматирование — производная от цифр. Разделитель добавляется только
// перед следующей цифрой, поэтому Backspace никогда не упирается в «)» или «-».
function formatPhone(digits) {
  if (!digits) return "";
  const rest = digits.slice(1);
  let out = "+7";
  if (rest.length) out += " (" + rest.slice(0, 3);
  if (rest.length > 3) out += ") " + rest.slice(3, 6);
  if (rest.length > 6) out += "-" + rest.slice(6, 8);
  if (rest.length > 8) out += "-" + rest.slice(8, 10);
  return out;
}

// Ставит курсор после n-й цифры отформатированной строки.
function caretAfterDigits(value, count) {
  if (count <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (/\d/.test(value[i])) {
      seen += 1;
      if (seen === count) return i + 1;
    }
  }
  return value.length;
}

function setPhone(digits, caretDigits) {
  phoneDigits = digits;
  phoneInput.value = formatPhone(digits);
  const target = caretDigits === undefined
    ? phoneInput.value.length
    : caretAfterDigits(phoneInput.value, caretDigits);
  phoneInput.setSelectionRange(target, target);
}

// Код страны подставляется сразу, иначе первая «семёрка» номера 707…
// была бы неотличима от кода и съедалась бы маской.
function seedPrefix() {
  if (phoneDigits) return;
  phoneDigits = "7";
  phoneInput.value = "+7 (";
  seeded = true;
  phoneInput.setSelectionRange(4, 4);
}

phoneInput.addEventListener("focus", seedPrefix);

phoneInput.addEventListener("click", () => {
  if (seeded) phoneInput.setSelectionRange(4, 4);
});

phoneInput.addEventListener("input", (event) => {
  let raw = phoneInput.value;
  const caret = phoneInput.selectionStart;
  const rawDigitsLength = raw.replace(/\D/g, "").length;
  const smart = event.inputType === "insertFromPaste"
    || event.inputType === "insertReplacementText"
    || rawDigitsLength - phoneDigits.length > 1;

  let digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, "").length;

  const isDeleting = String(event.inputType || "").startsWith("delete");
  // Цифры, которые ввёл пользователь: подставленный код страны в счёт не идёт.
  const typed = seeded && raw.startsWith("+7 (")
    ? raw.slice(4).replace(/\D/g, "")
    : raw.replace(/\D/g, "");

  // Привычный ввод с восьмёрки там, где код страны уже стоит: это код, а не цифра номера.
  if (!smart && !isDeleting && typed === "8" && (seeded || phoneDigits === "")) {
    phoneDigits = "7";
    phoneInput.value = "+7 (";
    phoneInput.setSelectionRange(4, 4);
    seeded = true;
    clearError(phoneInput);
    return;
  }

  // Первая цифра в пустое поле — это код оператора, код страны подставляем сами.
  if (!smart && !isDeleting && phoneDigits === "" && typed.length === 1) {
    seeded = false;
    setPhone("7" + typed);
    clearError(phoneInput);
    return;
  }

  // Автозаполнение поверх подставленного префикса: свой «+7 (» отбрасываем.
  if (seeded && smart && raw.startsWith("+7 (")) {
    raw = raw.slice(4);
    digitsBeforeCaret = Math.max(0, digitsBeforeCaret - 1);
  }
  seeded = false;

  const digits = normalizePhone(raw, smart);
  const shift = digits.length - raw.replace(/\D/g, "").length;
  setPhone(digits, digitsBeforeCaret + shift);
  clearError(phoneInput);
});

phoneInput.addEventListener("paste", (event) => {
  const text = (event.clipboardData || window.clipboardData).getData("text");
  if (text === undefined || text === null) return;
  event.preventDefault();
  seeded = false;
  setPhone(normalizePhone(text, true));
  clearError(phoneInput);
});

phoneInput.addEventListener("blur", () => {
  if (phoneDigits.length <= 1) {
    phoneDigits = "";
    phoneInput.value = "";
  } else {
    phoneInput.value = formatPhone(phoneDigits);
  }
  seeded = false;
});

function resetPhone() {
  phoneDigits = "";
  phoneInput.value = "";
  seeded = false;
}

/* ---------- Валидация и отправка ---------- */

const form = document.getElementById("requestForm");
const status = document.getElementById("formStatus");

function setError(input, message) {
  const holder = document.querySelector(`[data-error-for="${input.id}"]`);
  if (holder) holder.textContent = message;
  const field = input.closest(".field");
  if (field) field.classList.add("is-invalid");
}

function clearError(input) {
  const holder = document.querySelector(`[data-error-for="${input.id}"]`);
  if (holder) holder.textContent = "";
  const field = input.closest(".field");
  if (field) field.classList.remove("is-invalid");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("name");
  const agree = document.getElementById("agree");
  let valid = true;

  clearError(name);
  clearError(phoneInput);
  clearError(agree);

  if (name.value.trim().length < 2) {
    setError(name, "Напишите имя, чтобы мы знали, к кому обращаться");
    valid = false;
  }

  // Валидация по количеству цифр, а не по длине форматированной строки.
  if (phoneDigits.length !== 11) {
    setError(phoneInput, "Нужны все 11 цифр номера");
    valid = false;
  }

  if (!agree.checked) {
    setError(agree, "Без согласия не сможем обработать заявку");
    valid = false;
  }

  if (!valid) {
    status.hidden = true;
    return;
  }

  const payload = {
    name: name.value.trim(),
    phone: phoneDigits,              // в бэкенд уходят чистые цифры
    phoneE164: "+" + phoneDigits,
    tour: document.getElementById("tour").value || null,
    date: document.getElementById("date").value || null,
    people: Number(document.getElementById("people").value) || 1,
    comment: document.getElementById("comment").value.trim() || null
  };

  console.log("Заявка:", payload);

  form.reset();
  resetPhone();

  status.hidden = false;
  status.textContent = `${payload.name}, заявка принята. Перезвоним на ${formatPhone(payload.phone)} в течение рабочего дня.`;
});

/* ---------- Шапка и мобильное меню ---------- */

const header = document.getElementById("header");
const nav = document.getElementById("nav");
const burger = document.getElementById("burger");

function syncHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 60 || nav.classList.contains("is-open"));
}

window.addEventListener("scroll", syncHeader, { passive: true });
syncHeader();

burger.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  header.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", String(open));
  syncHeader();
});

nav.addEventListener("click", (event) => {
  if (event.target.tagName !== "A") return;
  nav.classList.remove("is-open");
  header.classList.remove("is-open");
  burger.setAttribute("aria-expanded", "false");
  syncHeader();
});

/* ---------- Появление блоков при скролле ---------- */

const revealTargets = document.querySelectorAll(".section__head, .tour, .about__text, .about__media, .review, .request__text, .form");
revealTargets.forEach((el) => el.classList.add("reveal"));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    observer.unobserve(entry.target);
  });
}, { rootMargin: "0px 0px -80px 0px" });

revealTargets.forEach((el) => observer.observe(el));
