const { getWilayaList, getBaladyiatsForWilaya,getWilayaByCode  } = require('@dzcode-io/leblad');

try {
    // const baladiyat = getBaladyiatsForWilaya(1)
    // console.log(baladiyat)
    // console.log(getWilayaList())
    console.log(getBaladyiatsForWilaya(3)); 
} catch(error) {
    console.log(error)
}