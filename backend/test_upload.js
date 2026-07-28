import fs from 'fs';

async function test() {
  const form = new FormData();
  form.append('name', 'Test Product');
  form.append('description', 'Test Description');
  form.append('price', '10');
  form.append('countInStock', '5');
  
  // Create a dummy file
  fs.writeFileSync('dummy.jpg', 'fake image data');
  
  const fileBlob = new Blob([fs.readFileSync('dummy.jpg')], { type: 'image/jpeg' });
  form.append('images', fileBlob, 'dummy.jpg');

  try {
    const res = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      body: form
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
