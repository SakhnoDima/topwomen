import axios from "axios";

export async function euroclearCrawler() {
  const baseURL =
    "https://don.fa.em2.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions";
  const params = {
    onlyData: true,
    expand:
      "requisitionList.secondaryLocations,flexFieldsFacet.values,requisitionList.requisitionFlexFields",
    finder:
      "findReqs;siteNumber=CX_1003,facetsList=LOCATIONS;WORK_LOCATIONS;WORKPLACE_TYPES;TITLES;CATEGORIES;ORGANIZATIONS;POSTING_DATES;FLEX_FIELDS",
    limit: 100,
    offset: 0,
  };

  while (true) {
    try {
      const response = await axios.get(baseURL, { params });
      const data = response.data;

      // Логуємо відповідь
      console.log(data);

      // Перевіряємо, чи відповідь пуста
      if (!data || Object.keys(data).length === 0) {
        console.log("Отримано пустий JSON, завершення.");
        break;
      }

      // Оновлюємо параметри для наступного запиту
      params.offset += params.limit;
    } catch (error) {
      console.error("Сталася помилка під час запиту:", error);
      break;
    }
  }
}
