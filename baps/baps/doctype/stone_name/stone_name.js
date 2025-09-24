// Copyright (c) 2025, Tirthan Shah and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Stone Name", {
// 	refresh(frm) {

// 	},
// });





frappe.ui.form.on("Stone Name", {
  main_part: function (frm) {
    updateStoneCode(frm);
  },
  sub_part: function (frm) {
    updateStoneCode(frm);
  },
  stone_name: function (frm) {
    updateStoneCode(frm);
  },
});

function abbrevMainPart(text) {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words[0].toLowerCase() === "ground") {
    return "B" + words[words.length - 1][0].toUpperCase(); // Ground Floor = BM
  }
  return words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase();
}

function abbrevSubPart(text) {
  if (!text) return "";
  if (text.toLowerCase().startsWith("type ")) {
    return text.replace("Type ", "").toUpperCase(); // Type A6 -> A6
  }
  return text.substring(0, 3).toUpperCase(); // Kharo -> KHR
}

function abbrevStoneName(text) {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words.length === 1) {
    return text.substring(0, 2).toUpperCase(); // Rekha -> RE
  }
  return words.map(w => (/^\d+$/.test(w) ? w : w[0].toUpperCase())).join(""); 
  // Layer 1 -> L1, Pillar Theko -> PT
}

function generateStoneCode(mainPart, subPart, stoneName) {
  const mainCode = abbrevMainPart(mainPart);
  const subCode = abbrevSubPart(subPart);
  const stoneCode = abbrevStoneName(stoneName);
  return (mainCode + subCode + stoneCode).toUpperCase();
}

function updateStoneCode(frm) {
  if (frm.doc.main_part && frm.doc.sub_part && frm.doc.stone_name) {
    frm.set_value(
      "stone_code",
      generateStoneCode(frm.doc.main_part, frm.doc.sub_part, frm.doc.stone_name)
    );
  }
}