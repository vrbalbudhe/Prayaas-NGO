fetch("/prayaas/admin/data3")
  .then((response) => response.json()) // Parse the response as JSON
  .then((data) => {
    console.log("this is the data1", data);
    const values = [
      data.totalUsersDonatedMoney,
      data.food,
      data.clothes,
      data.Stationary,
      data.Gadgets,
      data.Footware,
    ]; // Extract values for the pie chart

    var ctx = document.getElementById("pieChart1").getContext("2d");
    var chartData = {
      labels: [
        "Amount",
        "Food",
        "Clothes",
        "Stationary",
        "Gadgets",
        "Footware",
      ],
      datasets: [
        {
          label: "Fund Allocation",
          data: values,
          backgroundColor: [
            "#003049", // Dark Blue
            "#d9d9d9", // Greenish Blue
            "#f07167", // Light Orange

            "#3d405b",
            "#8d99ae",
            "#7209b7",
          ],
          borderWidth: 1,
        },
      ],
    };

    var pieChart = new Chart(ctx, {
      type: "pie", // Pie chart type
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: "Pie Chart of Funds Categorization",
          },
        },
      },
    });
  })
  .catch((error) => console.error("Error fetching data:", error));
