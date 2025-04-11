// const express = require('express');
// const cors = require('cors'); // นำเข้า cors
// const app = express();
// const axios = require('axios');

// app.use(cors()); // เปิดการใช้งาน CORS

// app.use(express.json()); // แปลง request body ที่ได้จาก
// app.use(express.static('frontend')); // ถ้าคุณเก็บไฟล์ไว้ในโฟลเดอร์ public

const bodyParser = require('body-parser');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const { console } = require('inspector');

const app = express();

app.use(cors());  // Enable CORS for all routes

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend'))); // For serving static files


const droneconfigserver = 'https://script.google.com/macros/s/AKfycbzwclqJRodyVjzYyY-NTQDb9cWG6Hoc5vGAABVtr5-jPA_ET_2IasrAJK4aeo5XoONiaA/exec'
const dronelogserver = 'https://app-tracking.pockethost.io/api/collections/drone_logs/records'


app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));





app.get("/configs/:id", (req, res) => {

    const id = Number(req.params.id);
  
    axios
      .get(droneconfigserver)
      .then((response) => {
        const data = response.data.data;
  
        const drone = data.find((d) => d.drone_id === id);
  
        if (!drone) {
          return res.status(404).send({ error: "drone_id not found" });
        }
  
        if (drone.max_speed == null) {
          drone.max_speed = 100;
        } else if (drone.max_speed > 110) {
          drone.max_speed = 110;
        }
  
        res.send({
          drone_id: drone.drone_id,
          drone_name: drone.drone_name,
          light: drone.light,
          country: drone.country,
          max_speed: drone.max_speed,
          population: drone.population,
        });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
      });
  });
  /*app.get("/GET", (req, res) => {
    axios
      .get(droneconfigserver)
      .then((response) => {
        let data = response.data.headers;
  
        if (!data.max_speed) {
          data.max_speed = 100;
        } else if (data.max_speed > 110) {
          data.max_speed = 110;
        }
        res.send(data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
      });
  });*/
app.get('/status/:id', async (req, res) => {
    const droneId = Number(req.params.id); // ดึง drone_id จาก URL
    try {
        const response = await axios.get(droneconfigserver); // ส่ง GET request ไปยัง Drone Log Server
        const droneStatusData = response.data.data; // ดึงข้อมูลสถานะจากเซิร์ฟเวอร์

        // ค้นหาสถานะของโดรนตาม droneId
        const droneStatus = droneStatusData.find(status => status.drone_id === droneId);

        if (droneStatus) {
            res.json({ condition: droneStatus.condition || "unknown" }); // ส่งคืนสถานะของโดรน
        } else {
            res.status(404).json({ message: "Drone status not found" }); // หากไม่พบสถานะ
        }
        res.send(droneStatus)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error" }); // จัดการข้อผิดพลาด
    }
});


app.get('/logs/:id', async (req, res) => {
  const droneID = req.params.id;

  // สร้าง URL ที่มี filter, sort, limit
  const url = `${dronelogserver}?filter=drone_id=${droneID}&sort=-created&perPage=25`;

  try {
    const response = await axios.get(url);
    let logs = response.data.items;

    // กรองเฉพาะ field ที่ต้องการ
    const filteredLogs = logs.map(log => ({
      drone_id: log.drone_id,
      drone_name: log.drone_name,
      created: log.created,
      country: log.country,
      celsius: log.celsius
    }));

    res.json(filteredLogs);
  } catch (error) {
    console.error('Error fetching logs:', error.message);
    res.status(500).json({ message: 'Error fetching drone logs' });
  }
});


app.get('/logs', async (req, res) => {
    try {
        const { page = 1, pageSize = 25 } = req.query; // Default to page 1 and 20 items per page
        const allLogs = [];
        let currentPage = page;
        let hasMorePages = true;

        // ดึงข้อมูลเฉพาะหน้าๆ โดยไม่ต้องดึงทั้งหมด
        while (hasMorePages) {
            const response = await axios.get(`https://app-tracking.pockethost.io/api/collections/drone_logs/records?page=${currentPage}`);
            const logs = response.data.items;

            if (!logs || logs.length === 0) {
                hasMorePages = false;
            } else {
                allLogs.push(...logs);
                currentPage++;
            }
        }

        // คัดกรองข้อมูล log และเรียงลำดับตามวันที่
        const filteredLogs = allLogs.filter(log =>
            log.created && log.country && log.drone_id && log.drone_name && log.celsius
        );

        const sortedLogs = filteredLogs.sort((a, b) => new Date(b.created) - new Date(a.created));

        // การแบ่งหน้า
        const startIndex = (page - 1) * pageSize;
        const paginatedLogs = sortedLogs.slice(startIndex, startIndex + pageSize);

        // ส่งผลลัพธ์กลับไป
        res.json({
            logs: paginatedLogs,
            total: sortedLogs.length,
            page: parseInt(page),
            pageSize: parseInt(pageSize)
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).send('Error fetching logs');
    }
});




app.post('/logs', async (req, res) => {
      if (!req.body.celsius) {
        return res.status(400).send("Please provide the celsius value");
    }

    const celsius = req.body.celsius;
    const country = "Thailand";
    const droneId = 65011075;
    const droneName = "Sorrapat";

    try {
        const { data } = await axios.post(dronelogserver, {
            celsius: celsius,
            country: country,
            drone_id: droneId,
            drone_name: droneName
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 20250301efx'
            }
        });

        console.log("Data generated: ", data);
        res.status(200).json({
            message: "Insert complete",
            input_celsius: celsius,
            generated_data: data,
            country: country,
            drone_id: droneId,
            drone_name: droneName
        });
    } catch (error) {
        console.error("Error: ", error.message);
        res.status(500).send("Error handling the data");
    }
  })



app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'drone.html'));
});



const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

