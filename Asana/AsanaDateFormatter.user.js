// ==UserScript==
// @name         Asana Date Formatter
// @version      2025-02-09
// @description  Asanaの日付表示を yyyy/MM/dd (ddd) のフォマットに変換する
// @match        https://app.asana.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=asana.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const weeks = [
    "日曜日",
    "月曜日",
    "火曜日",
    "水曜日",
    "木曜日",
    "金曜日",
    "土曜日",
  ];
  const relativeDays = ["昨日", "今日", "明日"];
  const asanaDateRegex = /((?<year>\d+)年 )?((?<month>\d+)月 )?(?<date>\d+)日/;

  /**
   * Asanaの日付テキストをDateオブジェクトに変換する
   * @param {string} dateText - Asanaの日付テキスト
   * @param {Date} today - 今日の日付
   * @param {Date|null} [prevDate=null] - 前回の日付
   * @returns {Date|string} - 変換された日付または元のテキスト
   */
  function parseAsanaDate(dateText, today = new Date(), prevDate = null) {
    if (weeks.includes(dateText)) {
      const dayOfWeek = today.getDay();
      const week = weeks.indexOf(dateText);
      const date = new Date(today);
      date.setDate(
        today.getDate() + week - dayOfWeek + (week < dayOfWeek ? 7 : 0)
      );
      return date;
    }

    if (relativeDays.includes(dateText)) {
      const date = new Date(today);
      date.setDate(today.getDate() + relativeDays.indexOf(dateText) - 1);
      return date;
    }

    const match = asanaDateRegex.exec(dateText);
    if (match) {
      const baseDate = prevDate || today;
      return new Date(
        match.groups.year || baseDate.getFullYear(),
        match.groups.month ? match.groups.month - 1 : baseDate.getMonth(),
        match.groups.date
      );
    }

    return dateText;
  }

  /**
   * Dateオブジェクトをフォーマットされた文字列に変換する
   * @param {Date} date - 変換する日付
   * @returns {string} - フォーマットされた日付文字列
   */
  function convertDateFormat(date) {
    if (!(date instanceof Date) || isNaN(date)) {
      return date;
    }

    const yyyy = date.getFullYear();
    const MM = date.getMonth() + 1;
    const dd = date.getDate();
    const ddd = weeks[date.getDay()][0];
    return `${yyyy}/${MM}/${dd} (${ddd})`;
  }

  /**
   * Asanaに表示されている曜日を日付に変換する
   */
  function convertDueDateToDate() {
    const today = new Date();
    let prevDate = null;
    document
      .querySelectorAll("span.DueDate-noWrapSegment:not(.converted)")
      .forEach((span) => {
        const isRange = span.textContent.startsWith(" – ");
        const date = parseAsanaDate(
          span.textContent.replace(" – ", ""),
          today,
          isRange ? prevDate : null
        );
        span.textContent = (isRange ? " - " : "") + convertDateFormat(date);
        span.classList.add("convertedDateFormat");
        prevDate = date;
      });
  }

  /**
   * 初期化
   */
  function init() {
    convertDueDateToDate();

    const observer = new MutationObserver(() => {
      convertDueDateToDate();
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  init();
})();
