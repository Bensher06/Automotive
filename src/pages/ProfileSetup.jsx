import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Phone, MapPin, Bike, Save, ChevronDown } from 'lucide-react'

// Philippine Geographic Data
const philippineData = {
  regions: [
    { code: 'NCR', name: 'National Capital Region (NCR)' },
    { code: 'CAR', name: 'Cordillera Administrative Region (CAR)' },
    { code: 'I', name: 'Region I - Ilocos Region' },
    { code: 'II', name: 'Region II - Cagayan Valley' },
    { code: 'III', name: 'Region III - Central Luzon' },
    { code: 'IV-A', name: 'Region IV-A - CALABARZON' },
    { code: 'IV-B', name: 'Region IV-B - MIMAROPA' },
    { code: 'V', name: 'Region V - Bicol Region' },
    { code: 'VI', name: 'Region VI - Western Visayas' },
    { code: 'VII', name: 'Region VII - Central Visayas' },
    { code: 'VIII', name: 'Region VIII - Eastern Visayas' },
    { code: 'IX', name: 'Region IX - Zamboanga Peninsula' },
    { code: 'X', name: 'Region X - Northern Mindanao' },
    { code: 'XI', name: 'Region XI - Davao Region' },
    { code: 'XII', name: 'Region XII - SOCCSKSARGEN' },
    { code: 'XIII', name: 'Region XIII - Caraga' },
    { code: 'BARMM', name: 'Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)' },
  ],
  provinces: {
    'NCR': ['Metro Manila'],
    'CAR': ['Abra', 'Apayao', 'Benguet', 'Ifugao', 'Kalinga', 'Mountain Province'],
    'I': ['Ilocos Norte', 'Ilocos Sur', 'La Union', 'Pangasinan'],
    'II': ['Batanes', 'Cagayan', 'Isabela', 'Nueva Vizcaya', 'Quirino'],
    'III': ['Aurora', 'Bataan', 'Bulacan', 'Nueva Ecija', 'Pampanga', 'Tarlac', 'Zambales'],
    'IV-A': ['Batangas', 'Cavite', 'Laguna', 'Quezon', 'Rizal'],
    'IV-B': ['Marinduque', 'Occidental Mindoro', 'Oriental Mindoro', 'Palawan', 'Romblon'],
    'V': ['Albay', 'Camarines Norte', 'Camarines Sur', 'Catanduanes', 'Masbate', 'Sorsogon'],
    'VI': ['Aklan', 'Antique', 'Capiz', 'Guimaras', 'Iloilo', 'Negros Occidental'],
    'VII': ['Bohol', 'Cebu', 'Negros Oriental', 'Siquijor'],
    'VIII': ['Biliran', 'Eastern Samar', 'Leyte', 'Northern Samar', 'Samar', 'Southern Leyte'],
    'IX': ['Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay'],
    'X': ['Bukidnon', 'Camiguin', 'Lanao del Norte', 'Misamis Occidental', 'Misamis Oriental'],
    'XI': ['Davao de Oro', 'Davao del Norte', 'Davao del Sur', 'Davao Occidental', 'Davao Oriental'],
    'XII': ['Cotabato', 'Sarangani', 'South Cotabato', 'Sultan Kudarat'],
    'XIII': ['Agusan del Norte', 'Agusan del Sur', 'Dinagat Islands', 'Surigao del Norte', 'Surigao del Sur'],
    'BARMM': ['Basilan', 'Lanao del Sur', 'Maguindanao del Norte', 'Maguindanao del Sur', 'Sulu', 'Tawi-Tawi'],
  },
  cities: {
    // NCR - Metro Manila
    'Metro Manila': ['Caloocan', 'Las Piñas', 'Makati', 'Malabon', 'Mandaluyong', 'Manila', 'Marikina', 'Muntinlupa', 'Navotas', 'Parañaque', 'Pasay', 'Pasig', 'Pateros', 'Quezon City', 'San Juan', 'Taguig', 'Valenzuela'],
    // Region IX - Zamboanga Peninsula
    'Zamboanga del Norte': ['Dapitan City', 'Dipolog City', 'Baliguian', 'Godod', 'Gutalac', 'Jose Dalman', 'Kalawit', 'Katipunan', 'La Libertad', 'Labason', 'Liloy', 'Manukan', 'Mutia', 'Piñan', 'Polanco', 'President Manuel A. Roxas', 'Rizal', 'Salug', 'Sergio Osmeña Sr.', 'Siayan', 'Sibuco', 'Sibutad', 'Sindangan', 'Siocon', 'Sirawai', 'Tampilisan'],
    'Zamboanga del Sur': ['Pagadian City', 'Zamboanga City', 'Aurora', 'Bayog', 'Dimataling', 'Dinas', 'Dumalinao', 'Dumingag', 'Guipos', 'Josefina', 'Kumalarang', 'Labangan', 'Lakewood', 'Lapuyan', 'Mahayag', 'Margosatubig', 'Midsalip', 'Molave', 'Pitogo', 'Ramon Magsaysay', 'San Miguel', 'San Pablo', 'Sominot', 'Tabina', 'Tambulig', 'Tigbao', 'Tukuran', 'Vincenzo A. Sagun'],
    'Zamboanga Sibugay': ['Alicia', 'Buug', 'Diplahan', 'Imelda', 'Ipil', 'Kabasalan', 'Mabuhay', 'Malangas', 'Naga', 'Olutanga', 'Payao', 'Roseller Lim', 'Siay', 'Talusan', 'Titay', 'Tungawan'],
    // Region VII - Central Visayas
    'Cebu': ['Cebu City', 'Lapu-Lapu City', 'Mandaue City', 'Danao City', 'Talisay City', 'Toledo City', 'Naga City', 'Carcar City', 'Bogo City', 'Alcantara', 'Alcoy', 'Alegria', 'Aloguinsan', 'Argao', 'Asturias', 'Badian', 'Balamban', 'Bantayan', 'Barili', 'Boljoon', 'Borbon', 'Carmen', 'Catmon', 'Compostela', 'Consolacion', 'Cordova', 'Daanbantayan', 'Dalaguete', 'Dumanjug', 'Ginatilan', 'Liloan', 'Madridejos', 'Malabuyoc', 'Medellin', 'Minglanilla', 'Moalboal', 'Oslob', 'Pilar', 'Pinamungajan', 'Poro', 'Ronda', 'Samboan', 'San Fernando', 'San Francisco', 'San Remigio', 'Santa Fe', 'Santander', 'Sibonga', 'Sogod', 'Tabogon', 'Tabuelan', 'Tuburan', 'Tudela'],
    'Bohol': ['Tagbilaran City', 'Alburquerque', 'Alicia', 'Anda', 'Antequera', 'Baclayon', 'Balilihan', 'Batuan', 'Bien Unido', 'Bilar', 'Buenavista', 'Calape', 'Candijay', 'Carmen', 'Catigbian', 'Clarin', 'Corella', 'Cortes', 'Dagohoy', 'Danao', 'Dauis', 'Dimiao', 'Duero', 'Garcia Hernandez', 'Getafe', 'Guindulman', 'Inabanga', 'Jagna', 'Lila', 'Loay', 'Loboc', 'Loon', 'Mabini', 'Maribojoc', 'Panglao', 'Pilar', 'President Carlos P. Garcia', 'Sagbayan', 'San Isidro', 'San Miguel', 'Sevilla', 'Sierra Bullones', 'Sikatuna', 'Talibon', 'Trinidad', 'Tubigon', 'Ubay', 'Valencia'],
    'Negros Oriental': ['Dumaguete City', 'Bayawan City', 'Bais City', 'Tanjay City', 'Canlaon City', 'Guihulngan City', 'Amlan', 'Ayungon', 'Bacong', 'Basay', 'Bindoy', 'Dauin', 'Jimalalud', 'La Libertad', 'Mabinay', 'Manjuyod', 'Pamplona', 'San Jose', 'Santa Catalina', 'Siaton', 'Sibulan', 'Tayasan', 'Valencia', 'Vallehermoso', 'Zamboanguita'],
    'Siquijor': ['Enrique Villanueva', 'Larena', 'Lazi', 'Maria', 'San Juan', 'Siquijor'],
    // Region XI - Davao
    'Davao del Sur': ['Davao City', 'Digos City', 'Bansalan', 'Hagonoy', 'Kiblawan', 'Magsaysay', 'Malalag', 'Matanao', 'Padada', 'Santa Cruz', 'Sulop'],
    'Davao del Norte': ['Tagum City', 'Panabo City', 'Island Garden City of Samal', 'Asuncion', 'Braulio E. Dujali', 'Carmen', 'Kapalong', 'New Corella', 'San Isidro', 'Santo Tomas', 'Talaingod'],
    'Davao de Oro': ['Compostela', 'Laak', 'Mabini', 'Maco', 'Maragusan', 'Mawab', 'Monkayo', 'Montevista', 'Nabunturan', 'New Bataan', 'Pantukan'],
    'Davao Occidental': ['Malita', 'Don Marcelino', 'Jose Abad Santos', 'Santa Maria', 'Sarangani'],
    'Davao Oriental': ['Mati City', 'Baganga', 'Banaybanay', 'Boston', 'Caraga', 'Cateel', 'Governor Generoso', 'Lupon', 'Manay', 'San Isidro', 'Tarragona'],
    // Region IV-A - CALABARZON
    'Cavite': ['Bacoor City', 'Cavite City', 'Dasmariñas City', 'General Trias City', 'Imus City', 'Tagaytay City', 'Trece Martires City', 'Alfonso', 'Amadeo', 'Carmona', 'General Emilio Aguinaldo', 'General Mariano Alvarez', 'Indang', 'Kawit', 'Magallanes', 'Maragondon', 'Mendez', 'Naic', 'Noveleta', 'Rosario', 'Silang', 'Tanza', 'Ternate'],
    'Laguna': ['Biñan City', 'Cabuyao City', 'Calamba City', 'San Pablo City', 'San Pedro City', 'Santa Rosa City', 'Alaminos', 'Bay', 'Calauan', 'Cavinti', 'Famy', 'Kalayaan', 'Liliw', 'Los Baños', 'Luisiana', 'Lumban', 'Mabitac', 'Magdalena', 'Majayjay', 'Nagcarlan', 'Paete', 'Pagsanjan', 'Pakil', 'Pangil', 'Pila', 'Rizal', 'Santa Cruz', 'Santa Maria', 'Siniloan', 'Victoria'],
    'Batangas': ['Batangas City', 'Lipa City', 'Tanauan City', 'Santo Tomas City', 'Agoncillo', 'Alitagtag', 'Balayan', 'Balete', 'Bauan', 'Calaca', 'Calatagan', 'Cuenca', 'Ibaan', 'Laurel', 'Lemery', 'Lian', 'Lobo', 'Mabini', 'Malvar', 'Mataasnakahoy', 'Nasugbu', 'Padre Garcia', 'Rosario', 'San Jose', 'San Juan', 'San Luis', 'San Nicolas', 'San Pascual', 'Santa Teresita', 'Taal', 'Talisay', 'Taysan', 'Tingloy', 'Tuy'],
    'Rizal': ['Antipolo City', 'Angono', 'Baras', 'Binangonan', 'Cainta', 'Cardona', 'Jalajala', 'Morong', 'Pililla', 'Rodriguez', 'San Mateo', 'Tanay', 'Taytay', 'Teresa'],
    'Quezon': ['Lucena City', 'Tayabas City', 'Agdangan', 'Alabat', 'Atimonan', 'Buenavista', 'Burdeos', 'Calauag', 'Candelaria', 'Catanauan', 'Dolores', 'General Luna', 'General Nakar', 'Guinayangan', 'Gumaca', 'Infanta', 'Jomalig', 'Lopez', 'Lucban', 'Macalelon', 'Mauban', 'Mulanay', 'Padre Burgos', 'Pagbilao', 'Panukulan', 'Patnanungan', 'Perez', 'Pitogo', 'Plaridel', 'Polillo', 'Quezon', 'Real', 'Sampaloc', 'San Andres', 'San Antonio', 'San Francisco', 'San Narciso', 'Sariaya', 'Tagkawayan', 'Tiaong', 'Unisan'],
    // Default cities for provinces not explicitly listed
    'default': ['City/Municipality Center', 'Poblacion', 'Other'],
  },
  barangays: {
    // Sample barangays for major cities
    'Zamboanga City': ['Ayala', 'Baliwasan', 'Boalan', 'Cabatangan', 'Canelar', 'Campo Islam', 'Cawit', 'Culianan', 'Divisoria', 'Guiwan', 'Labuan', 'La Paz', 'Lunzuran', 'Mampang', 'Mercedes', 'Pasonanca', 'Putik', 'Recodo', 'Rio Hondo', 'San Jose Cawa-Cawa', 'San Jose Gusu', 'San Roque', 'Santa Barbara', 'Santa Catalina', 'Santa Maria', 'Santo Niño', 'Sinunuc', 'Sta. Catalina', 'Talon-Talon', 'Tetuan', 'Tictapul', 'Tugbungan', 'Tumaga', 'Victoria', 'Vitali', 'Zone I', 'Zone II', 'Zone III', 'Zone IV'],
    'Cebu City': ['Apas', 'Banilad', 'Basak Pardo', 'Basak San Nicolas', 'Bulacao', 'Busay', 'Capitol Site', 'Carreta', 'Cogon Pardo', 'Cogon Ramos', 'Day-as', 'Duljo Fatima', 'Ermita', 'Guadalupe', 'Hipodromo', 'Inayawan', 'Kalubihan', 'Kamputhaw', 'Kamagayan', 'Kasambagan', 'Labangon', 'Lahug', 'Lorega San Miguel', 'Luz', 'Mabini', 'Mabolo', 'Malubog', 'Mambaling', 'Pahina Central', 'Pahina San Nicolas', 'Pardo', 'Pari-an', 'Paril', 'Pasil', 'Pit-os', 'Poblacion Pardo', 'Pulangbato', 'Pung-ol Sibugay', 'Punta Princesa', 'Quiot Pardo', 'Sambag I', 'Sambag II', 'San Antonio', 'San Jose', 'San Nicolas Proper', 'San Roque', 'Santa Cruz', 'Sawang Calero', 'Sinsin', 'Sirao', 'Suba', 'Sudlon I', 'Sudlon II', 'T. Padilla', 'Tabunan', 'Tagba-o', 'Talamban', 'Taptap', 'Tejero', 'Tinago', 'Tisa', 'To-ong', 'Zapatera'],
    'Manila': ['Binondo', 'Ermita', 'Intramuros', 'Malate', 'Paco', 'Pandacan', 'Port Area', 'Quiapo', 'Sampaloc', 'San Andres', 'San Miguel', 'San Nicolas', 'Santa Ana', 'Santa Cruz', 'Santa Mesa', 'Tondo'],
    'Quezon City': ['Alicia', 'Amihan', 'Apolonio Samson', 'Aurora', 'Baesa', 'Bagbag', 'Bagong Lipunan ng Crame', 'Bagong Pag-asa', 'Bagong Silangan', 'Bagumbayan', 'Bagumbuhay', 'Bahay Toro', 'Balingasa', 'Balong Bato', 'Batasan Hills', 'Bayanihan', 'Blue Ridge A', 'Blue Ridge B', 'Botocan', 'Bungad', 'Camp Aguinaldo', 'Capri', 'Central', 'Claro', 'Commonwealth', 'Culiat', 'Damar', 'Damayan', 'Damayang Lagi', 'Del Monte', 'Diliman', 'Dioquino Zobel', 'Don Manuel', 'Doña Aurora', 'Doña Imelda', 'Doña Josefa', 'Duyan-Duyan', 'E. Rodriguez', 'East Kamias', 'Escopa I', 'Escopa II', 'Escopa III', 'Escopa IV', 'Fairview', 'Greater Lagro', 'Gulod', 'Holy Spirit', 'Horseshoe', 'Immaculate Concepcion', 'Kaligayahan', 'Kalusugan', 'Kamuning', 'Katipunan', 'Kaunlaran', 'Kristong Hari', 'Krus na Ligas', 'Laging Handa', 'Libis', 'Lourdes', 'Loyola Heights', 'Maharlika', 'Malaya', 'Mangga', 'Manresa', 'Mariana', 'Mariblo', 'Marilag', 'Masagana', 'Masambong', 'Matandang Balara', 'Milagrosa', 'N.S. Amoranto', 'Nagkaisang Nayon', 'Nayong Kanluran', 'New Era', 'North Fairview', 'Novaliches Proper', 'Obrero', 'Old Capitol Site', 'Paang Bundok', 'Pag-ibig sa Nayon', 'Paligsahan', 'Paltok', 'Pansol', 'Paraiso', 'Pasong Putik Proper', 'Pasong Tamo', 'Payatas', 'Phil-Am', 'Pinagkaisahan', 'Pinyahan', 'Project 6', 'Quirino 2-A', 'Quirino 2-B', 'Quirino 2-C', 'Quirino 3-A', 'Ramon Magsaysay', 'Roxas', 'Sacred Heart', 'Saint Ignatius', 'Saint Peter', 'Salvacion', 'San Agustin', 'San Antonio', 'San Bartolome', 'San Isidro', 'San Isidro Labrador', 'San Jose', 'San Martin de Porres', 'San Roque', 'San Vicente', 'Sangandaan', 'Santa Cruz', 'Santa Lucia', 'Santa Monica', 'Santa Teresita', 'Santo Cristo', 'Santo Domingo', 'Santo Niño', 'Santol', 'Sauyo', 'Sienna', 'Sikatuna Village', 'Silangan', 'Socorro', 'South Triangle', 'Tagumpay', 'Talayan', 'Talipapa', 'Tandang Sora', 'Tatalon', 'Teachers Village East', 'Teachers Village West', 'U.P. Campus', 'U.P. Village', 'Ugong Norte', 'Unang Sigaw', 'Valencia', 'Vasra', 'Veterans Village', 'Villa Maria Clara', 'West Kamias', 'West Triangle', 'White Plains'],
    'Davao City': ['Agdao', 'Bajada', 'Baliok', 'Bangkal', 'Baracatan', 'Biao Escuela', 'Biao Guinga', 'Biao Joaquin', 'Bucana', 'Buhangin', 'Bunawan', 'Cabantian', 'Calinan', 'Callawa', 'Catalunan Grande', 'Catalunan Pequeño', 'Crossing Bayabas', 'Daliao', 'Daliaon Plantation', 'Dominga', 'Dumoy', 'Eden', 'Fatima', 'Gatungan', 'Gov. Paciano Bangoy', 'Gov. Vicente Duterte', 'Ilang', 'Indangan', 'Kap. Tomas Monteverde Sr.', 'Lacson', 'Langub', 'Leon Garcia Sr.', 'Lizada', 'Los Amigos', 'Lubogan', 'Lumiad', 'Ma-a', 'Maa', 'Mabuhay', 'Magsaysay', 'Magtuod', 'Mahayag', 'Malabog', 'Malagos', 'Malamba', 'Manambulan', 'Mandug', 'Manuel Guianga', 'Mapula', 'Marfori', 'Marilog', 'Matina Aplaya', 'Matina Biao', 'Matina Crossing', 'Matina Pangi', 'Megkawayan', 'Mintal', 'Mudiang', 'Mulig', 'New Carmen', 'New Valencia', 'Pampanga', 'Panacan', 'Panalum', 'Pandaitan', 'Pangyan', 'Paquibato', 'Paradise Embak', 'Rafael Castillo', 'Riverside', 'Salapawan', 'Salaysay', 'Saloy', 'San Antonio', 'San Isidro', 'Santo Niño', 'Sasa', 'Sibulan', 'Sirawan', 'Sirib', 'Suawan', 'Subasta', 'Sumimao', 'Tacunan', 'Tagakpan', 'Tagluno', 'Tagurano', 'Talandang', 'Talomo', 'Talomo River', 'Tamayong', 'Tambobong', 'Tamugan', 'Tapak', 'Tawan-tawan', 'Tibuloy', 'Tibungco', 'Tigatto', 'Toril', 'Tugbok', 'Tungakalan', 'Ubalde', 'Ula', 'Vicente Hizon Sr.', 'Waan', 'Wangan', 'Wilfredo Aquino', 'Wines'],
    'default': ['Poblacion', 'Centro', 'Other'],
  }
}

const ProfileSetup = () => {
  // Name fields
  const [firstName, setFirstName] = useState('')
  const [middleInitial, setMiddleInitial] = useState('')
  const [lastName, setLastName] = useState('')
  
  const [phone, setPhone] = useState('')
  const [vehicleBrand, setVehicleBrand] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehicleYear, setVehicleYear] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { updateProfile, user } = useAuth()
  const navigate = useNavigate()

  // Address dropdown state
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedBarangay, setSelectedBarangay] = useState('')
  const [streetAddress, setStreetAddress] = useState('')

  // Dropdown options
  const [provinces, setProvinces] = useState([])
  const [cities, setCities] = useState([])
  const [barangays, setBarangays] = useState([])

  const isShopOwner = user?.role === 'store_owner'

  // Update provinces when region changes
  useEffect(() => {
    if (selectedRegion) {
      const regionProvinces = philippineData.provinces[selectedRegion] || []
      setProvinces(regionProvinces)
      setSelectedProvince('')
      setSelectedCity('')
      setSelectedBarangay('')
      setCities([])
      setBarangays([])
    }
  }, [selectedRegion])

  // Update cities when province changes
  useEffect(() => {
    if (selectedProvince) {
      const provinceCities = philippineData.cities[selectedProvince] || philippineData.cities['default']
      setCities(provinceCities)
      setSelectedCity('')
      setSelectedBarangay('')
      setBarangays([])
    }
  }, [selectedProvince])

  // Update barangays when city changes
  useEffect(() => {
    if (selectedCity) {
      const cityBarangays = philippineData.barangays[selectedCity] || philippineData.barangays['default']
      setBarangays(cityBarangays)
      setSelectedBarangay('')
    }
  }, [selectedCity])

  // Build full address string
  const getFullAddress = () => {
    const parts = []
    if (streetAddress) parts.push(streetAddress)
    if (selectedBarangay) parts.push(`Brgy. ${selectedBarangay}`)
    if (selectedCity) parts.push(selectedCity)
    if (selectedProvince) parts.push(selectedProvince)
    if (selectedRegion) {
      const region = philippineData.regions.find(r => r.code === selectedRegion)
      if (region) parts.push(region.name)
    }
    return parts.join(', ')
  }

  const vehicleBrands = [
    'Honda',
    'Yamaha',
    'Suzuki',
    'Kawasaki',
    'Kymco',
    'Other',
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation - check required fields
    if (!firstName || !lastName) {
      setError('Please enter your first name and last name')
      return
    }

    if (!phone) {
      setError('Please enter your phone number')
      return
    }

    if (!selectedRegion || !selectedProvince || !selectedCity || !selectedBarangay) {
      setError('Please complete your address (Region, Province, City, and Barangay)')
      return
    }

    if (!isShopOwner && (!vehicleBrand || !vehicleModel || !vehicleYear)) {
      setError('Please fill in all vehicle details')
      return
    }

    setLoading(true)

    try {
      // Build full name from components
      const fullName = middleInitial 
        ? `${firstName} ${middleInitial}. ${lastName}`
        : `${firstName} ${lastName}`
      
      const fullAddress = getFullAddress()
      
      const profileData = {
        firstName,
        middleInitial,
        lastName,
        full_name: fullName,
        phone,
        address: fullAddress,
        // Address breakdown for database
        region: selectedRegion,
        province: selectedProvince,
        city: selectedCity,
        barangay: selectedBarangay,
        street_address: streetAddress,
        needsSetup: false,
      }

      // Only include vehicle details for non-shop owners
      if (!isShopOwner) {
        profileData.vehicle = {
          brand: vehicleBrand,
          model: vehicleModel,
          year: vehicleYear,
        }
        profileData.vehicle_brand = vehicleBrand
        profileData.vehicle_model = vehicleModel
        profileData.vehicle_year = vehicleYear ? parseInt(vehicleYear) : null
      }

      const result = await updateProfile(profileData)
      
      if (result.success) {
        // Navigate based on user role after profile setup
        if (user?.role === 'admin') {
          navigate('/admin/dashboard')
        } else if (user?.role === 'store_owner') {
          // Shop owners go to shop verification
          navigate('/shop-verification')
        } else {
          navigate('/')
        }
      } else {
        setError(result.error || 'Failed to save profile. Please try again.')
      }
    } catch (err) {
      console.error('Profile setup error:', err)
      setError(err.message || 'Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Redirect to login if not authenticated
  if (!user) {
    return null // ProtectedRoute will handle the redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            {isShopOwner 
              ? 'Set up your contact information to continue'
              : 'Help us provide you with better service'
            }
          </p>
        </div>

        {/* Profile Setup Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Name Fields */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* First Name */}
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                    placeholder="John"
                  />
                </div>

                {/* Middle Initial */}
                <div>
                  <label
                    htmlFor="middleInitial"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Middle Initial
                  </label>
                  <input
                    id="middleInitial"
                    type="text"
                    value={middleInitial}
                    onChange={(e) => setMiddleInitial(e.target.value.toUpperCase().slice(0, 1))}
                    maxLength={1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                    placeholder="M"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number (for emergency contact)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                  placeholder="+63 912 345 6789"
                />
              </div>
            </div>

            {/* Address Dropdowns */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-5 h-5 text-primary" />
                <label className="block text-sm font-medium text-gray-700">
                Address / Location
              </label>
              </div>

              {/* Region Dropdown */}
              <div>
                <label htmlFor="region" className="block text-xs font-medium text-gray-600 mb-1">
                  Region
                </label>
                <div className="relative">
                  <select
                    id="region"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Select Region</option>
                    {philippineData.regions.map((region) => (
                      <option key={region.code} value={region.code}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Province Dropdown */}
              <div>
                <label htmlFor="province" className="block text-xs font-medium text-gray-600 mb-1">
                  Province
                </label>
                <div className="relative">
                  <select
                    id="province"
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    required
                    disabled={!selectedRegion}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Province</option>
                    {provinces.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* City/Municipality Dropdown */}
              <div>
                <label htmlFor="city" className="block text-xs font-medium text-gray-600 mb-1">
                  City / Municipality
                </label>
                <div className="relative">
                  <select
                    id="city"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    required
                    disabled={!selectedProvince}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select City/Municipality</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Barangay Dropdown */}
              <div>
                <label htmlFor="barangay" className="block text-xs font-medium text-gray-600 mb-1">
                  Barangay
                </label>
              <div className="relative">
                  <select
                    id="barangay"
                    value={selectedBarangay}
                    onChange={(e) => setSelectedBarangay(e.target.value)}
                  required
                    disabled={!selectedCity}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Barangay</option>
                    {barangays.map((barangay) => (
                      <option key={barangay} value={barangay}>
                        {barangay}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label htmlFor="streetAddress" className="block text-xs font-medium text-gray-600 mb-1">
                  Street Address / House No. (Optional)
                </label>
                <input
                  id="streetAddress"
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                  placeholder="e.g., 123 Main Street, Building A"
                />
              </div>

              {/* Full Address Preview */}
              {(selectedRegion || selectedProvince || selectedCity || selectedBarangay) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-700 mb-1">Complete Address:</p>
                  <p className="text-sm text-blue-900">{getFullAddress() || 'Select your location above'}</p>
                </div>
              )}
            </div>

            {/* Vehicle Details Section - Only for non-shop owners */}
            {!isShopOwner && (
              <div className="border-t pt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Bike className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Vehicle Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Vehicle Brand */}
                  <div>
                    <label
                      htmlFor="vehicleBrand"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Brand
                    </label>
                    <select
                      id="vehicleBrand"
                      value={vehicleBrand}
                      onChange={(e) => setVehicleBrand(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="">Select Brand</option>
                      {vehicleBrands.map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Vehicle Model */}
                  <div>
                    <label
                      htmlFor="vehicleModel"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Model
                    </label>
                    <input
                      id="vehicleModel"
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                      placeholder="e.g., Click 125i"
                    />
                  </div>

                  {/* Vehicle Year */}
                  <div>
                    <label
                      htmlFor="vehicleYear"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Year
                    </label>
                    <input
                      id="vehicleYear"
                      type="number"
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                      required
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                      placeholder="2020"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Shop Owner Note */}
            {isShopOwner && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  After completing your profile, you'll be redirected to register your shop details.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? 'Saving...' : isShopOwner ? 'Continue to Shop Registration' : 'Complete Setup'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProfileSetup
