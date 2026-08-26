from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()



def hashPassword(password):
    hashedPassword = ph.hash(password)
    return hashedPassword



def verifyPassword(password, storedHash):
    try:
        ph.verify(storedHash, password)
        return True
    except VerifyMismatchError:
        return False