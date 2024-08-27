fetch("/prayaas/admin/data3")
  .then((response) => response.json())
  .then((data) => {
    console.log("this is the data1", data);

    // Array of values
    const values = [
      data.clothesQuantity,
      data.foodQuantity,
      data.valuesStationary,
      data.valuesGadgets,
      data.valuesFootware
    ];

    // Chart context
    var ctx = document.getElementById("barChart1").getContext("2d");

    // Chart data
    var chartData = {
      labels: ["Clothes", "Food", "Stationary", "Gadgets", "Footware"],
      datasets: [
        {
          label: "Total Quantity",
          data: values,
          backgroundColor: [
            "#5a189a",
            "#001845",
            "#121845",
            "#102845",
            "#011945"
          ],
          borderWidth: 2,
        }
      ],
    };

    // Create bar chart
    var barChart = new Chart(ctx, {
      type: "bar",
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true, // Display legend
            position: "top",
          },
          title: {
            display: true,
            text: "Quantity of Items Received",
          },
        },
        scales: {
          x: {
            stacked: false,
            ticks: {
              font: {
                size: 12
              },
              padding: 10,
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              font: {
                size: 12
              },
            },
          },
        },
      },
    });
  })
  .catch((error) => console.error("Error fetching data:", error));
