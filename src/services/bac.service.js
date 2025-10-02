/**
 * BAC (Blood Alcohol Content) service.
 * Calculates BAC based on customer transactions and beer consumption.
 * Supports both simple drink counting and precise ABV/volume calculations.
 */

import { listEventTransactions } from './transactions.service.js'
import { listEventBeers } from './beers.service.js'

// Standard drink alcohol content (can be customized per beer type)
const DEFAULT_ALCOHOL_GRAMS_PER_DRINK = 12 // grams of pure alcohol per standard drink
const DEFAULT_BEER_VOLUME_ML = 500 // Standard beer volume in milliliters
const DEFAULT_BEER_ABV = 4.5 // Default ABV percentage if not specified
const ALCOHOL_ELIMINATION_RATE = 0.015 // BAC percentage eliminated per hour
const ALCOHOL_DENSITY = 0.789 // g/ml - density of ethanol

/**
 * Calculate grams of pure alcohol from ABV and volume
 * @param {number} abv - Alcohol by volume percentage (e.g., 5.0 for 5%)
 * @param {number} volumeMl - Volume in milliliters
 * @returns {number} Grams of pure alcohol
 */
function calculateAlcoholGrams(abv, volumeMl) {
  // Validate inputs
  const validAbv = parseFloat(abv)
  const validVolume = parseFloat(volumeMl)
  
  if (isNaN(validAbv) || validAbv <= 0 || validAbv > 100) {
    console.warn('Invalid ABV:', abv, 'using default')
    return DEFAULT_ALCOHOL_GRAMS_PER_DRINK
  }
  
  if (isNaN(validVolume) || validVolume <= 0) {
    console.warn('Invalid volume:', volumeMl, 'using default')
    return DEFAULT_ALCOHOL_GRAMS_PER_DRINK
  }
  
  // Formula: Volume (ml) × ABV (%) × Alcohol Density (0.789 g/ml) / 100
  const result = (validVolume * validAbv * ALCOHOL_DENSITY) / 100
  return isNaN(result) ? DEFAULT_ALCOHOL_GRAMS_PER_DRINK : result
}

/**
 * Get beer details by event_beer_id from a list of event beers
 * @param {Array} eventBeers - Array of event beer objects
 * @param {string} eventBeerId - Event beer ID to find
 * @returns {Object|null} Beer object or null if not found
 */
function findBeerById(eventBeers, eventBeerId) {
  return eventBeers.find(beer => beer.id === eventBeerId) || null
}

/**
 * Calculate BAC based on customer info and drink count
 * @param {Object} params - Parameters
 * @param {number} params.weightKg - Customer weight in kg
 * @param {string} params.gender - 'male' or 'female'
 * @param {number} params.drinks - Number of drinks consumed
 * @param {number} params.hours - Hours since first drink
 * @param {number} [params.alcoholGramsPerDrink] - Grams of alcohol per drink (optional)
 * @returns {number} BAC percentage
 */
function calculateBAC({ weightKg, gender, drinks, hours, alcoholGramsPerDrink = DEFAULT_ALCOHOL_GRAMS_PER_DRINK }) {
  if (!weightKg || weightKg <= 0) return 0
  if (!drinks || drinks <= 0) return 0

  // Widmark formula constants (body water percentage)
  const r = gender === 'male' ? 3 : gender === 'female' ? 0.55 : (0.68 + 0.55) / 2
  
  const totalAlcoholGrams = drinks * alcoholGramsPerDrink
  const bac = (totalAlcoholGrams / (weightKg * r * 1000)) * 100 - (ALCOHOL_ELIMINATION_RATE * hours)

  return Math.max(0, bac) // BAC can't be negative
}

/**
 * Calculate BAC based on customer's actual beer transactions
 * @param {Object} customer - Customer object with weight and gender
 * @param {string} eventId - Event ID to get transactions for
 * @param {Date} [currentTime] - Current time (defaults to now)
 * @returns {Promise<Object>} BAC calculation result
 */
async function calculateCustomerBACFromTransactions(customer, eventId, currentTime = new Date()) {
  try {
    // Validate currentTime parameter
    let validCurrentTime
    try {
      validCurrentTime = currentTime instanceof Date ? currentTime : new Date(currentTime)
      if (isNaN(validCurrentTime.getTime())) {
        console.warn('Invalid currentTime provided:', currentTime, 'using new Date()')
        validCurrentTime = new Date()
      }
    } catch (e) {
      console.warn('Error parsing currentTime:', currentTime, 'using new Date()')
      validCurrentTime = new Date()
    }
    
    console.log('BAC calculation starting with currentTime:', validCurrentTime.toISOString())
    
    // Get all transactions and beer data for the event
    const [transactions, eventBeers] = await Promise.all([
      listEventTransactions(eventId),
      listEventBeers(eventId)
    ])
    
    // Filter transactions for this customer that contain alcohol
    const customerTransactions = transactions.filter(tx => 
      tx.customer_id === customer.id && 
      tx.event_beer_id && // Only beer transactions (not other items)
      tx.qty > 0
    )

    if (customerTransactions.length === 0) {
      return {
        bac: 0,
        totalDrinks: 0,
        totalAlcoholGrams: 0,
        hoursSinceFirstDrink: 0,
        transactions: [],
        beerDetails: []
      }
    }

    // Calculate total alcohol grams and time elapsed
    let totalAlcoholGrams = 0
    let totalDrinks = 0
    let firstDrinkTime = null
    const beerDetails = []
    const validTransactionTimes = []
    
    customerTransactions.forEach(tx => {
      const beer = findBeerById(eventBeers, tx.event_beer_id)
      
      // Parse transaction time with validation - check multiple possible timestamp fields
      let drinkTime
      const possibleTimeFields = [tx.ts, tx.created_at, tx.timestamp, tx.date, tx.time]
      const rawTimeValue = possibleTimeFields.find(field => field !== undefined && field !== null)
      
      try {
        if (rawTimeValue) {
          drinkTime = new Date(rawTimeValue)
          if (isNaN(drinkTime.getTime())) {
            console.warn('Invalid transaction date:', rawTimeValue, 'for transaction:', tx.id)
            drinkTime = null // Don't use fallback time for consistency
          }
        } else {
          console.warn('Missing timestamp in transaction:', tx.id, 'Available fields:', Object.keys(tx))
          drinkTime = null // Don't use fallback time for consistency
        }
      } catch (e) {
        console.warn('Error parsing transaction date:', rawTimeValue, 'for transaction:', tx.id, 'Error:', e)
        drinkTime = null // Don't use fallback time for consistency
      }
      
      console.log('Transaction time parsing:', {
        transactionId: tx.id,
        rawCreatedAt: rawTimeValue,
        parsedTime: drinkTime?.toISOString() || 'INVALID',
        isValid: drinkTime && !isNaN(drinkTime.getTime()),
        availableFields: Object.keys(tx)
      })
      
      // Only track valid drink times for firstDrinkTime
      if (drinkTime && !isNaN(drinkTime.getTime())) {
        validTransactionTimes.push(drinkTime)
        if (!firstDrinkTime || drinkTime < firstDrinkTime) {
          firstDrinkTime = drinkTime
        }
      }
      
      // Calculate alcohol content for this transaction
      let alcoholGramsPerDrink
      
      if (beer && beer.abv && beer.volume_ml) {
        // Use actual beer ABV and volume
        alcoholGramsPerDrink = calculateAlcoholGrams(beer.abv, beer.volume_ml)
      } else if (beer && beer.abv) {
        // Use ABV with default volume
        alcoholGramsPerDrink = calculateAlcoholGrams(beer.abv, DEFAULT_BEER_VOLUME_ML)
      } else {
        // Fallback to standard drink
        alcoholGramsPerDrink = DEFAULT_ALCOHOL_GRAMS_PER_DRINK
      }
      
      const transactionAlcohol = alcoholGramsPerDrink * tx.qty
      totalAlcoholGrams += transactionAlcohol
      totalDrinks += tx.qty
      
      // Store beer details for reference
      beerDetails.push({
        transaction: tx,
        beer: beer,
        alcoholGramsPerDrink,
        totalAlcoholGrams: transactionAlcohol,
        abv: beer?.abv || DEFAULT_BEER_ABV,
        volume_ml: beer?.volume_ml || DEFAULT_BEER_VOLUME_ML
      })
    })

    // Calculate hours since first drink using validated times
    let hoursSinceFirstDrink = 0
    if (firstDrinkTime && !isNaN(firstDrinkTime.getTime()) && !isNaN(validCurrentTime.getTime())) {
      const timeDifferenceMs = validCurrentTime.getTime() - firstDrinkTime.getTime()
      hoursSinceFirstDrink = Math.max(0, timeDifferenceMs / (1000 * 60 * 60))
    }

    console.log('Time calculation details:', {
      firstDrinkTime: firstDrinkTime?.toISOString() || 'NO_VALID_TIME',
      currentTime: validCurrentTime.toISOString(),
      timeDifferenceMs: firstDrinkTime ? (validCurrentTime.getTime() - firstDrinkTime.getTime()) : 0,
      hoursSinceFirstDrink,
      validTransactionCount: validTransactionTimes.length,
      totalTransactionCount: customerTransactions.length
    })

    // Get customer weight and gender, with defaults and validation
    let weightKg = parseFloat(customer.weight)
    if (isNaN(weightKg) || weightKg <= 0) {
      console.warn('Invalid customer weight:', customer.weight, 'using default 70kg')
      weightKg = 70 // Default 70kg if no weight
    }
    
    const gender = customer.gender || 'male' // Default to male if no gender
    
    console.log('Customer data for BAC:', { 
      customerId: customer.id, 
      name: customer.name, 
      weightKg, 
      gender, 
      totalAlcoholGrams, 
      hoursSinceFirstDrink 
    })

    // Calculate BAC using total alcohol grams
    const bac = calculateBACFromAlcoholGrams({
      weightKg,
      gender,
      totalAlcoholGrams,
      hours: hoursSinceFirstDrink
    })

    // Validate final values before returning
    const finalBAC = isNaN(bac) ? 0 : parseFloat(bac.toFixed(3))
    const finalAlcoholGrams = isNaN(totalAlcoholGrams) ? 0 : parseFloat(totalAlcoholGrams.toFixed(1))
    const finalHours = isNaN(hoursSinceFirstDrink) ? 0 : parseFloat(hoursSinceFirstDrink.toFixed(2))
    
    const result = {
      bac: finalBAC,
      totalDrinks,
      totalAlcoholGrams: finalAlcoholGrams,
      hoursSinceFirstDrink: finalHours,
      transactions: customerTransactions,
      beerDetails,
      weightKg,
      gender
    }
    
    console.log('Final BAC calculation result:', result)
    return result

  } catch (error) {
    console.error('Error calculating customer BAC:', error)
    return {
      bac: 0,
      totalDrinks: 0,
      totalAlcoholGrams: 0,
      hoursSinceFirstDrink: 0,
      transactions: [],
      beerDetails: [],
      error: error.message
    }
  }
}


/**
 * Calculate BAC directly from total alcohol grams consumed
 * @param {Object} params - Parameters
 * @param {number} params.weightKg - Customer weight in kg
 * @param {string} params.gender - 'male' or 'female'
 * @param {number} params.totalAlcoholGrams - Total grams of pure alcohol consumed
 * @param {number} params.hours - Hours since first drink
 * @returns {number} BAC percentage
 */
function calculateBACFromAlcoholGrams({ weightKg, gender, totalAlcoholGrams, hours }) {
  // Validate and parse inputs
  const validWeight = parseFloat(weightKg)
  const validAlcohol = parseFloat(totalAlcoholGrams)
  const validHours = parseFloat(hours) || 0
  
  console.log('BAC calculation inputs:', { weightKg, gender, totalAlcoholGrams, hours, validWeight, validAlcohol, validHours })
  
  if (isNaN(validWeight) || validWeight <= 0) {
    console.warn('Invalid weight:', weightKg, 'returning 0 BAC')
    return 0
  }
  if (isNaN(validAlcohol) || validAlcohol <= 0) {
    console.warn('Invalid alcohol amount:', totalAlcoholGrams, 'returning 0 BAC')
    return 0
  }

  // Widmark formula constants (body water percentage)
  const r = gender === 'male' ? 3 : gender === 'female' ? 0.55 : (0.68 + 0.55) / 2
  
  // BAC = (alcohol in grams / (body weight in grams × r)) × 100 - (elimination rate × hours)
  const bacBeforeElimination = (validAlcohol / (validWeight * 1000 * r)) * 100
  const elimination = ALCOHOL_ELIMINATION_RATE * validHours
  const bac = bacBeforeElimination - elimination
  
  console.log('BAC calculation details:', { bacBeforeElimination, elimination, finalBAC: bac })
  
  const result = Math.max(0, bac) // BAC can't be negative
  return isNaN(result) ? 0 : result
}

/**
 * Get BAC status and warnings (uses Norwegian promille standards)
 * @param {number} bac - BAC percentage (will be converted to promille for display)
 * @returns {Object} Status information
 */
function getBACStatus(bac) {
  // Convert to promille for Norwegian standards
  const promille = bac * 10
  
  if (promille === 0) {
    return { level: 'sober', message: 'Edru', color: 'green', canDrive: true }
  } else if (promille < 0.2) {
    return { level: 'minimal', message: 'Minimal påvirkning', color: 'green', canDrive: true }
  } else if (promille < 0.5) {
    return { level: 'light', message: 'Lett påvirkning', color: 'yellow', canDrive: false }
  } else if (promille < 0.8) {
    return { level: 'moderate', message: 'Moderat påvirkning', color: 'orange', canDrive: false }
  } else if (promille < 1.5) {
    return { level: 'high', message: 'Høy påvirkning', color: 'red', canDrive: false }
  } else {
    return { level: 'severe', message: 'Alvorlig påvirkning', color: 'darkred', canDrive: false }
  }
}

/**
 * Estimate time until sober (BAC = 0)
 * @param {number} currentBAC - Current BAC percentage
 * @returns {number} Hours until sober
 */
function estimateTimeUntilSober(currentBAC) {
  if (currentBAC <= 0) return 0
  return currentBAC / ALCOHOL_ELIMINATION_RATE
}

export {
  calculateBAC,
  calculateBACFromAlcoholGrams,
  calculateCustomerBACFromTransactions,
  calculateAlcoholGrams,
  getBACStatus,
  estimateTimeUntilSober,
  findBeerById,
  DEFAULT_ALCOHOL_GRAMS_PER_DRINK,
  DEFAULT_BEER_VOLUME_ML,
  DEFAULT_BEER_ABV,
  ALCOHOL_ELIMINATION_RATE,
  ALCOHOL_DENSITY
}