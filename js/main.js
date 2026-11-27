(function () {
  var root = document.documentElement;
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var store = document.querySelector("[data-appstore]");
  if (store && store.getAttribute("href") === "#") {
    store.setAttribute("aria-disabled", "true");
    store.addEventListener("click", function (event) {
      event.preventDefault();
    });
  }

  if (!motion.matches && "IntersectionObserver" in window) {
    var targets = document.querySelectorAll("[data-reveal]");
    if (targets.length) {
      root.classList.add("reveal-on");
      var seen = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-seen");
              seen.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
      );
      targets.forEach(function (el) {
        seen.observe(el);
      });
    }
  }

  var stage = document.querySelector("[data-stage]");
  if (!stage) return;

  var toggle = document.querySelector("[data-stage-toggle]");
  var card = stage.querySelector("[data-card]");
  var status = stage.querySelector("[data-status]");
  var chip = stage.querySelector("[data-chip]");
  var chipLabel = stage.querySelector("[data-chip-label]");
  var dots = stage.querySelectorAll("[data-dots] i");
  var scanOrder = ["company", "name", "alt", "title", "mobile", "email"];
  var fillOrder = ["name", "alt", "company", "title", "mobile", "email"];
  var lines = {};
  var values = {};
  scanOrder.forEach(function (key) {
    lines[key] = stage.querySelector('.cl[data-f="' + key + '"]');
    values[key] = stage.querySelector('.v[data-v="' + key + '"]');
  });

  var cards = [
    {
      skin: "polaris",
      group: "partners",
      groupLabel: "Partners",
      company: "Polaris Design Studio",
      name: "陳怡君",
      alt: "Grace Chen",
      title: "Creative Director",
      mobile: "+886 912 345 678",
      email: "grace@polaris.example",
    },
    {
      skin: "harbor",
      group: "vcs",
      groupLabel: "VCs",
      company: "Harbor Pine Ventures",
      name: "林志豪",
      alt: "Jason Lin",
      title: "Partner",
      mobile: "+886 922 108 460",
      email: "jason@harborpine.example",
    },
    {
      skin: "kumo",
      group: "clients",
      groupLabel: "Potential clients",
      company: "Kumo Robotics",
      name: "王雅婷",
      alt: "Tina Wang",
      title: "Head of Sales",
      mobile: "+886 935 220 714",
      email: "tina@kumo.example",
    },
  ];

  var run = 0;
  var userPaused = false;
  var onScreen = true;
  var waiters = [];
  var STOP = {};

  function blocked() {
    return userPaused || !onScreen || document.hidden;
  }

  function release() {
    if (blocked()) return;
    var pending = waiters;
    waiters = [];
    pending.forEach(function (resolve) {
      resolve();
    });
  }

  function wait(ms, token) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (token !== run) reject(STOP);
        else resolve();
      }, ms);
    });
  }

  function gate(token) {
    return new Promise(function (resolve, reject) {
      var done = function () {
        if (token !== run) reject(STOP);
        else resolve();
      };
      if (blocked()) waiters.push(done);
      else done();
    });
  }

  function setCard(index) {
    var data = cards[index];
    card.setAttribute("data-skin", data.skin);
    scanOrder.forEach(function (key) {
      lines[key].textContent = data[key];
      values[key].textContent = data[key];
    });
    chip.setAttribute("data-group", data.group);
    chipLabel.textContent = data.groupLabel;
    dots.forEach(function (dot, i) {
      dot.classList.toggle("is-on", i === index);
    });
  }

  function clearMarks() {
    scanOrder.forEach(function (key) {
      lines[key].classList.remove("is-hit", "is-taken");
      values[key].classList.remove("is-in", "is-fly");
      values[key].style.transform = "";
      values[key].style.transition = "";
    });
    chip.classList.remove("is-in");
  }

  function fly(key) {
    var line = lines[key];
    var value = values[key];
    var from = line.getBoundingClientRect();
    var to = value.getBoundingClientRect();
    var scale = Math.max(0.55, Math.min(1.25, from.height / to.height));
    var dx = from.left - to.left;
    var dy = from.top - to.top;
    value.style.transition = "none";
    value.style.transform =
      "translate(" + dx + "px," + dy + "px) scale(" + scale + ")";
    value.classList.add("is-fly", "is-in");
    line.classList.add("is-taken");
    void value.offsetWidth;
    value.style.transition = "";
    value.style.transform = "";
    setTimeout(function () {
      value.classList.remove("is-fly");
    }, 820);
  }

  function leave() {
    scanOrder.forEach(function (key) {
      values[key].classList.remove("is-in", "is-fly");
    });
    chip.classList.remove("is-in");
    stage.setAttribute("data-phase", "exit");
  }

  async function play(index, token) {
    stage.classList.add("no-tr");
    stage.setAttribute("data-phase", "out");
    clearMarks();
    setCard(index);
    status.textContent = "New scan";
    void stage.offsetWidth;
    stage.classList.remove("no-tr");
    stage.setAttribute("data-phase", "tilt");
    await wait(1150, token);
    await gate(token);

    stage.setAttribute("data-phase", "scan");
    status.textContent = "Reading";
    await wait(620, token);
    for (var i = 0; i < scanOrder.length; i++) {
      lines[scanOrder[i]].classList.add("is-hit");
      await wait(i === 0 ? 330 : 105, token);
    }
    await wait(520, token);
    await gate(token);

    stage.setAttribute("data-phase", "fill");
    for (var j = 0; j < fillOrder.length; j++) {
      fly(fillOrder[j]);
      await wait(190, token);
    }
    await wait(760, token);
    await gate(token);

    chip.classList.add("is-in");
    status.textContent = "6 fields filled";
    stage.setAttribute("data-phase", "done");
    await wait(2600, token);
    await gate(token);

    leave();
    await wait(560, token);
  }

  async function loop(token) {
    try {
      stage.classList.add("is-live");
      stage.setAttribute("data-phase", "done");
      scanOrder.forEach(function (key) {
        lines[key].classList.add("is-hit");
        values[key].classList.add("is-in");
      });
      chip.classList.add("is-in");
      await wait(1700, token);
      await gate(token);
      leave();
      await wait(560, token);
      var index = 1;
      while (token === run) {
        await play(index, token);
        index = (index + 1) % cards.length;
      }
    } catch (error) {
      if (error !== STOP) throw error;
    }
  }

  function start() {
    run += 1;
    var token = run;
    if (toggle) toggle.hidden = false;
    var fonts =
      document.fonts && document.fonts.ready
        ? document.fonts.ready
        : Promise.resolve();
    fonts.then(function () {
      if (token === run) loop(token);
    });
  }

  function stop() {
    run += 1;
    waiters = [];
    stage.classList.remove("is-live", "no-tr");
    stage.removeAttribute("data-phase");
    clearMarks();
    setCard(0);
    status.textContent = "6 fields filled";
    if (toggle) toggle.hidden = true;
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      userPaused = !userPaused;
      toggle.toggleAttribute("data-paused", userPaused);
      toggle.lastElementChild.textContent = userPaused
        ? "Play animation"
        : "Pause animation";
      release();
    });
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        onScreen = entries[entries.length - 1].isIntersecting;
        release();
      },
      { threshold: 0.15 },
    ).observe(stage);
  }

  document.addEventListener("visibilitychange", release);

  var onMotionChange = function () {
    if (motion.matches) stop();
    else start();
  };
  motion.addEventListener("change", onMotionChange);

  if (!motion.matches) start();
})();
