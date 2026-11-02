// Full list of card objects for the level
// @ param {Array} deck

// Array of string clues - 
// ex. “The card is red”
// @ param {Array<string>} knownInformation

// Array of card IDs that match the clues
// @ returns {Array<string>}


export function getRemainingPossibleCards(deck: any[], knownInformation: any[]): any[] {

if (!deck || !Array.isArray(deck)) return [];

if (!knownInformation || knownInformation.length === 0){
		return deck.map((card: any) => card.id);
}


	return deck
	.filter ((card: any) => {
		return knownInformation.every((clue: any) => matchesClue(card, clue.toLowerCase()));
	})
	.map((card: any) => card.id);

}






function matchesClue(card: any, clue: string): boolean {
	
const attrs = card.attributes || {};
	
	// color clues
	if (clue.includes('red')) return attrs.color?.toLowerCase() == 'red';
	if (clue.includes('black')) return attrs.color?.toLowerCase() === 'black';

	// suit clues
	if (clue.includes('hearts')) return attrs.suit?.toLowerCase() === 'hearts';
	if (clue.includes('diamonds')) return attrs.suit?.toLowerCase() === 'diamonds';
	if (clue.includes('spades')) return attrs.suit?.toLowerCase() === 'spades';
	if (clue.includes('clubs')) return attrs.suit?.toLowerCase() === 'clubs';
	
	if (clue.includes('face card')) { 
const faceCards = ['jack', 'queen', 'king']; 
const isFace = faceCards.includes(String(attrs.value).toLowerCase()) || attrs.isFaceCard === true; 
return clue.includes('not') ? !isFace : isFace; 
}

return true;


}

// UNIT TESTS (run to verify your code)

function runTests () {
	const mockDeck = [ 
{ id: 'card_01', name: 'Ace of Spades', attributes: { color: 'black', suit: 'spades', value: 11 } }, 
{ id: 'card_02', name: '10 of Hearts', attributes: { color: 'red', suit: 'hearts', value: 10 } }, 
{ id: 'card_03', name: 'King of Hearts', attributes: { color: 'red', suit: 'hearts', value: 'king' } }, 
{ id: 'card_04', name: '7 of Diamonds', attributes: { color: 'red', suit: 'diamonds', value: 7 } } ];

console.log('--- Running Person E Tests ---');


// Test 1: Filter by red suit 

const res1 = getRemainingPossibleCards(mockDeck, ['The card is red', 'The suit is hearts']);
console.assert( 
JSON.stringify(res1) === JSON.stringify(['card_02', 'card_03']), 
`Test 1 Failed: Expected ['card_02', 'card_03'], got ${JSON.stringify(res1)}` );

	// Test 2: No clues returns all cards 

const res2 = getRemainingPossibleCards(mockDeck, []); 
console.assert( 
res2.length === 4, 
`Test 2 Failed: Expected 4 cards, got ${res2.length}` 
);

console.log('All tests completed successfully!');

}
