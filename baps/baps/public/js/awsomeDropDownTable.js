
// // Patch Awesomplete positioning inside scrollable grids
// $(document).on('awesomplete-open', function () {
//   const input = document.activeElement;
//   if (!input || !input.className.includes('awesomplete')) return;

//   const dropdown = document.querySelector('.awesomplete ul');
//   if (!dropdown) return;

//   // Recalculate position relative to input
//   const rect = input.getBoundingClientRect();
//   const gridBody = input.closest('.grid-body') || input.closest('.form-grid-container');

//   // If inside a scrollable container, adjust for its scroll
//   const scrollTop = gridBody ? gridBody.scrollTop : window.pageYOffset;

//   Object.assign(dropdown.style, {
//     position: 'absolute',
//     top: `${rect.bottom + scrollTop}px`,
//     left: `${rect.left + window.scrollX}px`,
//     width: `${rect.width}px`,
//     zIndex: '9999',
//     maxHeight: '300px',
//     overflowY: 'auto',
//     border:'1px solid   ',
//     boxSizing: 'border-box',
//     borderRadius: "10px"
//   });

//   // Append to body to escape overflow clipping
//   if (dropdown.parentNode !== document.body) {
//     document.body.appendChild(dropdown);
//   }
// });


// Patch Awesomplete positioning inside scrollable grids
$(document).on('awesomplete-open', function () {
  const input = document.activeElement;
  if (!input || !input.className.includes('awesomplete')) return;

  const dropdown = document.querySelector('.awesomplete ul');
  if (!dropdown) return;

  // Recalculate position relative to input
  const rect = input.getBoundingClientRect();
  const gridBody = input.closest('.grid-body') || input.closest('.form-grid-container');

  // If inside a scrollable container, adjust for its scroll
  const scrollTop = gridBody ? gridBody.scrollTop : window.pageYOffset;

  Object.assign(dropdown.style, {
    position: 'absolute',
    top: `${rect.bottom + scrollTop}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`,
    zIndex: '9999',
    maxHeight: '280px',
    overflowY: 'auto',
    background: '#fff',
    border: '1px solid var(--border-color, #e5e7eb)',
    borderRadius: '0.5rem', // 8px like ERPNext cards
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)', // ERPNext-like subtle shadow
    boxSizing: 'border-box',
    padding: '4px 0'
  });

  // Append to body to escape overflow clipping
  if (dropdown.parentNode !== document.body) {
    document.body.appendChild(dropdown);
  }

  // Add ERPNext-like list item styling
  dropdown.querySelectorAll('p').forEach(li => {
    Object.assign(li.style, {
      padding: '6px 10px',
      fontSize: '13px',
      cursor: 'pointer',
      borderRadius: '4px',
      transition: 'background 0.2s ease'
    });

    li.addEventListener('mouseenter', () => {
      li.style.background = 'var(--gray-100, #f3f4f6)';
    });
    li.addEventListener('mouseleave', () => {
      li.style.background = 'transparent';
    });
  });
});