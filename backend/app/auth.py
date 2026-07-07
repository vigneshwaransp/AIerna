import hashlib
import secrets

def hash_password(password: str) -> str:
    """Hash a password using PBKDF2 with SHA-256 and a unique salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}${key.hex()}"

def verify_password(stored_password: str, provided_password: str) -> bool:
    """Verify a password against a stored hashed password, with fallback for plain text."""
    try:
        if '$' not in stored_password:
            # Fallback for unhashed plain text passwords
            return stored_password == provided_password
            
        salt, key_hex = stored_password.split('$')
        key = hashlib.pbkdf2_hmac(
            'sha256',
            provided_password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        return key.hex() == key_hex
    except Exception:
        return False
