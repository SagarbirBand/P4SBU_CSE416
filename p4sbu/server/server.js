//INITIALIZE APP via express() AND ALSO GET SUPABASE FROM DB.JS FILE!!

//STORE THIS IN .ENV 
const JWT_SECRET = 'supersecretkey';

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// NOTE: supabase is not imported or defined anywhere - make sure to include this
// const supabase = require('./db'); // Or however you're importing Supabase

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');




/* BUILDINGS API CODE START */

//Select buildings (for reservation)
app.get('/buildings', async (req, res) => {
  // FIXED: Incorrect bracket placement in try-catch block
  try {
    const { data, error } = await supabase.from('buildings').select('*');
    
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




app.post('/buildings/createBuilding', async (req, res) => {
  const { name, coordinates } = req.body;

  // Basic input check
  if (!name || !coordinates) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabase
      .from('buildings')
      .insert([{
        name,
        coordinates
      }]);

    if (error) throw error;

    res.status(201).json({ message: 'Building registered successfully', user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* END OF BUILDINGS API CODE */






/* FINES API CODE START */

//Select all fines given a user ID
app.get('/fines/:userID', async (req, res) => {
  const userID = req.params.userID;

  // FIXED: Incorrect bracket placement in try-catch block
  try {
    const { data, error } = await supabase.from('fines').select('*').eq('userID', userID);
    
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




//Select all fines (FOR ADMIN PURPOSES ONLY)
app.get('/fines', async (req, res) => {
  // FIXED: Removed unused variable
  // const userID = req.params.userID;

  // FIXED: Incorrect bracket placement in try-catch block
  try {
    const { data, error } = await supabase.from('fines').select('*');
    
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



//Select a specific fine (FOR A USER TO PAY UPON SELECTION)
app.get('/fines/:fineID', async (req, res) => {
  const fineID = req.params.fineID;

  // FIXED: Incorrect bracket placement in try-catch block
  // FIXED: Using 'id' instead of 'fineID' in the query
  // FIXED: Unnecessary select() call after .eq()
  try {
    const { data, error } = await supabase.from('fines').select('*').eq('id', fineID);
    
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




//Update fine to paid for a user (AFTER PAYMENT ACCEPTS AND EXISTS IN DATABASE)
app.put('/fines/:fineID', async (req, res) => {
  const fineID = req.params.fineID;
  const paymentID = req.params.paymentID;  // FIXED: Missing semicolon

  // FIXED: Incorrect bracket placement in try-catch block
  // FIXED: Incorrect table name 'payment' -> 'payments'
  // FIXED: Using 'id' instead of 'paymentID'
  try {
    const { data: payment, error: paymentError } = await supabase.from('payments').select('*').eq('id', paymentID).single(); //if paymentID does not exist then error thrown
    
    if (paymentError || !payment) {
      throw new Error('Payment not found');
    }

    const { data, error } = await supabase.from('fines').update({ statusPaid: true }).eq('id', fineID).select();
    
    if (error) throw error;

    res.json({ message: 'Fine updated to paid', fine: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




app.post('/fines/createFine', async (req, res) => {
  const { userID, amount, statusPaid } = req.body;

  // Basic input check
  if (!userID || !amount || !statusPaid) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabase
      .from('fines')
      .insert([{
        userID,
        amount,
        statusPaid
      }]);

    if (error) throw error;

    res.status(201).json({ message: 'Fine registered successfully', user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



/* END OF FINES API CODE */



/* PARKINGLOTS API CODE START */

//Select All Parking Lots (For User to see whilst reserve page and for Admin to keep tabs on)
app.get('/parkingLots', async (req, res) => {

  // FIXED: Incorrect bracket placement in try-catch block
  try {
    const { data, error } = await supabase.from('parkingLots').select('*');
    
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



//Select a Parking Lot by Name (FOR RESERVATION COMPLETION)
// FIXED: Route path conflict with '/parkingLots/:permitType'
app.get('/parkingLots/byName/:lotName', async (req, res) => {
  // FIXED: Using req.query instead of req.params
  const lotName = req.params.lotName;

  // FIXED: Incorrect bracket placement in try-catch block
  // FIXED: Using 'name' instead of variable 'lotName'
  try {
    const { data, error } = await supabase.from('parkingLots').select('*').eq('name', lotName).single();
    
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



//Select ParkingLots by permit type (FROM parkingSpotTypes TABLE)
// FIXED: Route path conflict with '/parkingLots/:lotName'
app.get('/parkingLots/byPermit/:permitType', async (req, res) => {
  const permitType = req.params.permitType;

  try {
 
    const { data: spotTypes, error: spotError } = await supabase
      .from('parkingSpotTypes')
      .select('lotID')
      .eq('permitType', permitType);

    if (spotError) throw spotError;

    const lotIDs = spotTypes.map(row => row.lotID); //map into an array

    if (lotIDs.length === 0) {
      return res.json([]); // no lots with this permitType
    }

    const { data: lots, error: lotError } = await supabase
      .from('parkingLots')
      .select('*')
      .in('id', lotIDs); 

    if (lotError) throw lotError;

    res.json(lots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.post('/parkingLots/createLot', async (req, res) => {
  const { name, location, capacityTotal, coordinates } = req.body;

  // Basic input check
  if (!name || !location || !capacityTotal || !coordinates) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabase
      .from('parkingLots')
      .insert([{
        name,
        location,
        capacityTotal,
        coordinates
      }]);

    if (error) throw error;

    res.status(201).json({ message: 'Parking Lot registered successfully', user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* END OF PARKINGLOTS API CODE */



/* PARKINGSPOTTYPES API CODE START */

//Select All ParkingSpotTypes (For ADMIN)
app.get('/parkingspotTypes', async (req, res) => {

  // FIXED: Incorrect bracket placement in try-catch block
  try {
    const { data, error } = await supabase.from('parkingSpotTypes').select('*');
    
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





app.post('/parkingSpotTypes/createSpotType', async (req, res) => {
  const { lotID, permitType, count, currentAvailable } = req.body;

  // Basic input check
  if (!lotID || !permitType || !count || !currentAvailable) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabase
      // FIXED: Incorrect table name 'parkingSpotType' -> 'parkingSpotTypes'
      .from('parkingSpotTypes')
      .insert([{
        lotID,
        permitType,
        count,
        currentAvailable
      }]);

    if (error) throw error;

    res.status(201).json({ message: 'Parking Spot Type registered successfully', user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



/* END OF PARKINGSPOTTYPES API CODE  */



/* PAYMENTS API CODE START */


//Select all payments (FOR ADMIN PURPOSES)
app.get('/payments', async (req, res) => {

  // FIXED: Incorrect bracket placement in try-catch block
  try {
    const { data, error } = await supabase.from('payments').select('*');
    
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




//Select all payments completed by a given user (ADMIN PURPOSES OR PROFILE HISTORY)
app.get('/payments/:userID', async (req, res) => {
  const userID = req.params.userID;

  // FIXED: Incorrect bracket placement in try-catch block
  try {
    const { data, error } = await supabase.from('payments').select('*').eq('userID', userID);
    
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



//USER CREATES A PAYMENT THAT THEY MUST COMPLETE
app.post('/payments/createPayment', async (req, res) => {
  const { userID, amount } = req.body;

  // Basic input check
  if (!userID || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabase
      .from('payments')
      .insert([{
        userID,
        amount
      }]);

    if (error) throw error;

    res.status(201).json({ message: 'Payment registered successfully', user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



/* END OF PAYMENTS API CODE */  // FIXED: Changed comment



/*
REPORTS API WILL BE IMPLEMENTED LATER. SKIP FOR NOW.
*/



/* RESERVATIONS API CODE START */

//Select all reservations (FOR ADMIN PURPOSES)
app.get('/reservations', async (req, res) => {

  // FIXED: Incorrect bracket placement in try-catch block
  try {
    const { data, error } = await supabase.from('reservations').select('*');
    
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




//Select all reservations completed by a given user (ADMIN PURPOSES OR PROFILE HISTORY)
app.get('/reservations/:userID', async (req, res) => {
  const userID = req.params.userID;

  // FIXED: Incorrect bracket placement in try-catch block
  try {
    const { data, error } = await supabase.from('reservations').select('*').eq('userID', userID);
    
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




app.post('/reservations/createReservation', async (req, res) => {
  const { userID, spotID, paymentID, startTime, endTime } = req.body;

  // Basic input check
  if (!userID || !spotID || !paymentID || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Check currentAvailable
    // FIXED: Using 'spotID' which isn't in the schema - should reference the parkingSpotTypes table differently
    const { data: spotTypeData, error: spotTypeError } = await supabase
      .from('parkingSpotTypes')
      .select('*')
      .eq('id', spotID)
      .single();

    if (spotTypeError) throw spotTypeError;

    const currAvail = spotTypeData.currentAvailable;

    if (currAvail <= 0) {
      return res.status(409).json({ error: 'No available spots for this type.' });
    }

    // 2. Insert reservation
    const { data: reservationData, error: reservationError } = await supabase
      .from('reservations')
      .insert([{ 
        userID, 
        spotID, 
        paymentID,
        // NOTE: Add createdAt if it's required by your schema and not auto-filled
        // createdAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (reservationError) throw reservationError;

    // 3. Update currentAvailable
    const newAvail = currAvail - 1;

    const { data: updatedSpot, error: updateError } = await supabase
      .from('parkingSpotTypes')
      .update({ currentAvailable: newAvail })
      .eq('id', spotID)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(201).json({
      message: 'Reservation registered successfully',
      reservation: reservationData,
      updatedSpot,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* END OF RESERVATIONS API CODE */


/* USERS API CODE START */

//Select all Users (ADMIN PURPOSES ONLY)
app.get('/users', async (req, res) => {

  // FIXED: Incorrect bracket placement in try-catch block
  try {
    const { data, error } = await supabase.from('users').select('*');
    
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





//Select a user given userID (ADMIN)
app.get('/user/:userID', async (req, res) => {
  const userID = req.params.userID;

  // FIXED: Incorrect bracket placement in try-catch block
  // FIXED: Using 'userID' in query but it should be 'id' according to schema
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', userID).single();
    
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





//Select a user given name (ADMIN)
// FIXED: Route conflict with '/user/:userID'
app.get('/user/byName/:userName', async (req, res) => {
  const userName = req.params.userName;

  // FIXED: Incorrect bracket placement in try-catch block
  // FIXED: Using 'userName' in query but 'name' in code
  try {
    const { data, error } = await supabase.from('users').select('*').eq('name', userName).single();
    
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Fetch the user by email OR USERNAME
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare raw password with hashed password
    const match = await bcrypt.compare(password, user.passBCrypt);

    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Issue JWT
    const token = jwt.sign({ userID: user.id }, JWT_SECRET, { expiresIn: '2h' });

    //omit password hash from response
    delete user.passBCrypt;

    res.json({ message: 'Login successful', token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





app.post('/register', async (req, res) => {
  const { name, email, passBCrypt, permitType, licensePlate, address } = req.body;

  // Basic input check
  if (!name || !email || !passBCrypt || !permitType || !licensePlate || !address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        name,
        email,
        passBCrypt,
        permitType,
        licensePlate,
        address,
        isAuth: false // default value
      }]);

    if (error) throw error;

    res.status(201).json({ message: 'User registered successfully', user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* END OF USERS API CODE */


/////////////////////////////////////
//TO DO LATER: REPORT GENERATION (revenue/avg. spots occupied) & PARKING SPOT ACTIVITY CHART
