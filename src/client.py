import socket
import sys

def client():
    # Check if there are enough arguments (server IP and port)
    if len(sys.argv) < 3:
        sys.exit(1)  # Exit with an error if not enough arguments

    server_ip = sys.argv[1]  # Extract server IP from arguments
    try:
        server_port = int(sys.argv[2])  # Convert port argument to integer
    except ValueError:
        sys.exit(1)  # Exit with an error if the port is not a valid integer

    # Create a TCP/IP socket
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        # Try to connect to the server at the specified IP and port
        client_socket.connect((server_ip, server_port))

        while True:
            # Get user input from the command line
            user_input = input("")

            # Send the user input to the server, appending a newline character
            client_socket.sendall((user_input + "\n").encode("utf-8"))
            
            try:
                # Receive the response from the server
                response = client_socket.recv(1024).decode("utf-8")
                
                # If no response is received, break out of the loop
                if not response:
                    break
            except ConnectionResetError:
                break  # Exit the loop if the server closes the connection

            print(response)  # Print the server's response

    except ConnectionRefusedError:
        # Handle the case where the server refuses the connection (e.g., server not running)
        print("Connection to the server was refused.")
    finally:
        # Close the client socket when done
        client_socket.close()

# Only run the client function if this script is executed directly
if __name__ == "__main__":
    client()