import { useState, useEffect, useRef } from 'react'; // Import necessary hooks from React
import Confetti from 'react-confetti'; // Import Confetti component for animation
import { Button, Input, List, message, Space, Typography, Card } from 'antd'; // Import Ant Design components
import './styles.css'; // Import CSS for styling

const { Title } = Typography; // Destructure the Title component from Ant Design Typography
const colors: string[] = ['#ff4d4f', '#ff7a45', '#ffc53d', '#73d13d', '#40a9ff', '#9254de']; // Define a color array for wheel segments

// Main function component
const WheelOfNames: React.FC = () => {
  // Define state variables using useState
  const [nameInput, setNameInput] = useState<string>('Alice\nBob\nCharlie\nDavid');
  const [names, setNames] = useState<string[]>(
    nameInput.split('\n').filter((name) => name.trim() !== ''),
  ); // Initial names list
  const [spinning, setSpinning] = useState<boolean>(false); // Boolean state to track if the wheel is spinning
  const [winner, setWinner] = useState<string | null>(null); // State to store the winner's name
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // Ref to access the canvas element directly
  const [rotation, setRotation] = useState<number>(0); // State to track the wheel's rotation angle
  const [showConfetti, setShowConfetti] = useState(false);

  // Update names when the textarea input changes
  useEffect(() => {
    setNames(nameInput.split('\n').filter((name) => name.trim() !== ''));
  }, [nameInput]);

  // useEffect hook to redraw the wheel whenever names or rotation state changes
  useEffect(() => {
    drawWheel(rotation); // Call the drawWheel function with the current rotation angle
  }, [names, rotation]);

  // Function to draw the wheel on the canvas
  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current; // Access the canvas element
    if (!canvas) return; // If canvas doesn't exist, exit the function
    const ctx = canvas.getContext('2d'); // Get 2D drawing context for the canvas
    if (!ctx) return; // If context doesn't exist, exit the function

    const totalNames = names.length; // Number of names to determine the number of slices
    const arc = (2 * Math.PI) / totalNames; // Calculate the arc angle for each slice

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings from the canvas
    ctx.save(); // Save the current drawing context state
    ctx.translate(canvas.width / 2, canvas.height / 2); // Move the origin to the center of the canvas
    ctx.rotate((angle * Math.PI) / 180); // Rotate the canvas by the specified angle to simulate the spin

    // Loop through each name and draw the corresponding slice on the wheel
    names.forEach((name, index) => {
      ctx.beginPath(); // Start a new path for the current slice
      ctx.fillStyle = colors[index % colors.length]; // Set the fill color for the slice
      ctx.moveTo(0, 0); // Move to the center of the canvas (start point of the arc)
      ctx.arc(0, 0, canvas.width / 2, index * arc, (index + 1) * arc); // Draw the slice arc
      ctx.lineTo(0, 0); // Close the path by drawing a line back to the center
      ctx.fill(); // Fill the slice with the current color
      ctx.stroke(); // Draw the outline of the slice

      // Drawing the name text inside the slice
      ctx.save(); // Save the current context state
      ctx.fillStyle = 'white'; // Set text color to white

      // Calculate font size based on the length of the name (you can adjust the factors for desired effect)
      const maxFontSize = 48; // Maximum font size
      const minFontSize = 14; // Minimum font size
      const nameLength = names.length;
      let fontSize = Math.max(minFontSize, maxFontSize - nameLength * 1.8); // Reduce size based on length
      if (fontSize > maxFontSize) fontSize = maxFontSize;
      ctx.font = `bold ${fontSize}px sans-serif`; // Apply the dynamic font size
      ctx.translate(
        Math.cos(index * arc + arc / 2) * (canvas.width / 3), // X position (based on angle and slice position)
        Math.sin(index * arc + arc / 2) * (canvas.height / 3), // Y position (based on angle and slice position)
      );
      ctx.rotate(index * arc + arc / 2); // Rotate text to align with the slice
      ctx.fillText(name, -ctx.measureText(name).width / 2, 5); // Draw the name text centered in the slice
      ctx.restore(); // Restore the context back to the previous state
    });

    // Draw "Click to Spin" in the center when not spinning
    if (!spinning) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px sans-serif';
      ctx.fillText('Click to Spin', -ctx.measureText('Click to Spin').width / 2, 10);
    }

    ctx.restore(); // Restore the context to its initial state before any transformations
  };

  // Function to handle the spin of the wheel
  const handleSpin = () => {
    if (names.length < 2) {
      // If there are fewer than two names, display an error message
      message.error('Add at least two names!');
      return;
    }

    setWinner(null); // Reset the winner before starting the spin
    setSpinning(true); // Set the spinning state to true to disable spin button
    const newRotation = rotation + 360 * 5 + Math.floor(Math.random() * 360); // Calculate a new random rotation angle
    animateSpin(rotation, newRotation, 4000); // Animate the spin for 4 seconds
  };

  // Function to animate the spin (smooth transition)
  const animateSpin = (start: number, end: number, duration: number) => {
    const startTime = Date.now(); // Record the start time of the animation
    const animate = () => {
      const elapsed = Date.now() - startTime; // Calculate elapsed time
      const progress = Math.min(elapsed / duration, 1); // Calculate the progress of the animation
      const easeOut = 1 - Math.pow(1 - progress, 3); // Ease-out function for smooth stopping
      setRotation(start + (end - start) * easeOut); // Set the current rotation based on progress

      if (progress < 1) {
        requestAnimationFrame(animate); // Continue the animation until it's complete
      } else {
        const normalizedRotation = ((end % 360) + 360) % 360; // Ensure positive angle within 0-360
        const segmentSize = 360 / names.length;
        const winnerIndex = Math.floor((360 - normalizedRotation) / segmentSize) % names.length; // Adjust for pointer position
        setWinner(names[winnerIndex]);
        setSpinning(false);
        message.success(`Winner: ${names[winnerIndex]}`);

        setShowConfetti(true);
        // Stop confetti after 15 seconds
        const confettiTime = 15000; // 15 seconds
        setTimeout(() => setShowConfetti(false), confettiTime);
      }
    };
    requestAnimationFrame(animate); // Start the animation loop
  };

  return (
    <Card title={'Wheel of Names'}>
      <div className="container">
        {/* Main container using flexbox */}
        <div className="wheel-container">
          {/* Container for the wheel */}
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="wheel"
            onClick={handleSpin}
            style={{ cursor: 'pointer' }}
          />
          {/* Canvas element for the wheel */}
          <div className="wheel-pointer"></div> {/* Pointer indicating the selected winner */}
        </div>
        <div className="list-container">
          {/* Container for the name list */}
          <Button type="primary" onClick={handleSpin} disabled={spinning}>
            {/* Spin button */}
            Spin the Wheel
          </Button>
          {winner && <Title level={3}>Winner: {winner}</Title>}

          {winner && (
            <>
              <Title level={3} style={{ color: '#52c41a', marginTop: 16 }}>
                Winner: {winner}
              </Title>
              {/* Display winner */}
              {showConfetti && <Confetti />}
              {/* Show confetti animation when there's a winner */}
            </>
          )}

          <Space>
            <Input.TextArea
              rows={20}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter names, each on a new line"
            />
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default WheelOfNames;
