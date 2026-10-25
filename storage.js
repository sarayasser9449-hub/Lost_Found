
(() => {
  const STORAGE_KEY = "campusfind_reports_v1";
  const SEED_KEY = "campusfind_seeded_v1";

  const sampleReports = [
    {
      id: "demo-101",
      title: "Black wireless headphones",
      category: "Electronics",
      kind: "Lost",
      status: "Lost",
      date: daysAgo(1),
      location: "Central Library · 2nd floor",
      description: "Black over-ear headphones with a small silver logo.",
      contact: "Maya",
      contactInfo: "maya.student@example.com",
      createdAt: Date.now() - 86400000
    },
    {
      id: "demo-102",
      title: "Blue water bottle",
      category: "Accessories",
      kind: "Found",
      status: "Found",
      date: daysAgo(0),
      location: "Science Building",
      description: "A blue reusable water bottle left beside the classroom.",
      contact: "Omar",
      contactInfo: "omar.student@example.com",
      createdAt: Date.now() - 3600000
    },
    {
      id: "demo-103",
      title: "Brown leather wallet",
      category: "Accessories",
      kind: "Found",
      status: "Claimed",
      date: daysAgo(2),
      location: "Student Cafeteria",
      description: "Brown fold-over wallet found near seating area.",
      contact: "Nour",
      contactInfo: "nour.student@example.com",
      createdAt: Date.now() - 172800000
    }
  ];

  function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function write(reports) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  }

  function seedIfNeeded() {
    if (localStorage.getItem(SEED_KEY) !== "yes") {
      const current = read();

      if (!current.length) {
        write(sampleReports);
      }

      localStorage.setItem(SEED_KEY, "yes");
    }
  }

  function getAll() {
    seedIfNeeded();

    return read().sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
  }

  function getById(id) {
    return getAll().find(item => item.id === id);
  }

  function add(report) {
    const reports = read();
    reports.unshift(report);
    write(reports);
    return report;
  }

  function update(id, patch) {
    const reports = read();
    const index = reports.findIndex(item => item.id === id);

    if (index < 0) return false;

    reports[index] = {
      ...reports[index],
      ...patch,
      updatedAt: Date.now()
    };

    write(reports);
    return true;
  }

  function remove(id) {
    write(read().filter(item => item.id !== id));
  }

  function reset() {
    write(sampleReports);
    localStorage.setItem(SEED_KEY, "yes");
  }

  window.CampusStore = {
    getAll,
    getById,
    add,
    update,
    remove,
    reset
  };
})();
