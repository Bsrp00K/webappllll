// // ฟังก์ชันแสดงหน้าเพจที่เลือก
// const API_HOST = "http://localhost:4000"; 
// let currentPage = 1;
// const pageSize = 20;
// function showPage(pageId) {
//     const pages = document.querySelectorAll('.page');
//     pages.forEach(page => page.style.display = 'none');
//     document.getElementById(pageId).style.display = 'block';
//   }
  
//   // แสดงหน้าแรก (View Config) ตอนเริ่มต้น
//   showPage('configPage');
  
//   // ฟังก์ชันดึง config
//   document.getElementById('viewConfigBtn').addEventListener('click', async () => {
//     const droneId = document.getElementById('droneId').value;
//     if (droneId) {
//       try {
//         const response = await fetch(`http://localhost:4000/configs/${droneId}`);
//         if (response.ok) {
//           const data = await response.json();
//           document.getElementById('configResult').innerHTML = `
//             <p>Drone ID: ${data.drone_id}</p>
//             <p>Drone Name: ${data.drone_name}</p>
//             <p>Light: ${data.light}</p>
//             <p>Country: ${data.country}</p>
//             <p>Max Speed: ${data.max_speed}</p>
//             <p>Population: ${data.population}</p>
//           `;
//         } else {
//           document.getElementById('configResult').innerText = 'Drone config not found';
//         }
const API_HOST = window.API_HOST || "http://localhost:4001";
let currentPage = 1;
const pageSize = 25;
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
  }
  
  // แสดงหน้าแรก (View Config) ตอนเริ่มต้น
  showPage('configPage');
  
  // ฟังก์ชันดึง config
  document.getElementById('viewConfigBtn').addEventListener('click', async () => {
    const droneId = document.getElementById('droneId').value;
    
    if (droneId) {
        try {
            const response = await fetch(`${API_HOST}/configs/${droneId}`)
            if (response.ok) {
                const data = await response.json();
                document.getElementById('configResult').innerHTML = `
                    <p>Drone ID: ${data.drone_id}</p>
                    <p>Drone Name: ${data.drone_name}</p>
                    <p>Light: ${data.light}</p>
                    <p>Country: ${data.country}</p>
                    <p>Max Speed: ${data.max_speed}</p>
                    <p>Population: ${data.population}</p>
                `;
            } else {
                document.getElementById('configResult').innerText = 'Drone config not found';
            }
        } catch (error) {
            document.getElementById('configResult').innerText = 'Error fetching drone config';
        }
    } else {
        alert('Please enter a valid Drone ID');
    }
});




async function submitTemperatureLog(event) {
    event.preventDefault();
    //const drone_id = document.getElementById('drone_id').value;
    //const drone_name = document.getElementById('drone_name').value;
    const celsius = document.getElementById('celsius').value;
    //const country = document.getElementById('country').value;

    const logData = {
        //drone_id: Number(drone_id),
        //drone_name: drone_name,
        celsius: Number(celsius),
        //country: country
    };

    try {
        const response = await fetch(`${API_HOST}/logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(logData)
        });

        const responseData = await response.json(); // รับข้อมูลตอบกลับ
        console.log('Response:', responseData); // แสดงข้อมูลตอบกลับ


        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Log submitted successfully!',
                confirmButtonColor: '#3085d6'
            });          
            document.getElementById('temperature-log-form').reset(); // ← ล้างฟอร์ม
            loadDroneLogs();  // โหลด logs ใหม่หลังจากส่งข้อมูลเสร็จ
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Error submitting log',
            });
        }
    } catch (error) {
        console.error('Error submitting log:', error);
        Swal.fire({
            icon: 'error',
            title: 'Network Error',
            text: 'Unable to submit log. Please try again later.'
        });
    }
}

// ฟังก์ชันสำหรับการโหลดข้อมูล log
async function loadDroneLogs(page = 1) {
    const logsTable = document.getElementById('logs-table').getElementsByTagName('tbody')[0];
    logsTable.innerHTML = ''; // Clear the table

    try {
        // ตรวจสอบ URL และ Query Params
        const response = await fetch(`${API_HOST}/logs?page=${page}&pageSize=${pageSize}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch logs');
        }

        const data = await response.json(); 
        const logs = data.logs;

        // ตรวจสอบว่ามี log หรือไม่
        if (logs.length > 0) {
            // แสดง log ในตาราง
            logs.forEach(log => {
                const rowHTML = `
                    <tr>
                        <td>${log.created}</td>
                        <td>${log.country}</td>
                        <td>${log.drone_id}</td>
                        <td>${log.drone_name}</td>
                        <td>${log.celsius}</td>
                    </tr>
                `;
                logsTable.innerHTML += rowHTML;
            });

            // อัปเดตการควบคุมหน้า
            document.getElementById('page-number').textContent = `Page ${page}`;
        } else {
            logsTable.innerHTML = '<tr><td colspan="5">No logs found</td></tr>';
        }
    } catch (error) {
        logsTable.innerHTML = '<tr><td colspan="5">Error loading logs</td></tr>';
        console.error('Error fetching drone logs:', error);
    }
}

// การแบ่งหน้า และเปลี่ยนหน้า
function setupPagination() {
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadDroneLogs(currentPage);
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        currentPage++;
        loadDroneLogs(currentPage);
    });
}

window.onload = () => {
    //loadDroneConfig();  // Load Drone Config
    loadDroneLogs(currentPage); // Load Logs
    setupPagination(); // Setup pagination controls
};
// ฟังก์ชันส่ง log เมื่อผู้ใช้กดปุ่ม submit
document.getElementById('temperature-log-form').addEventListener('submit', submitTemperatureLog);


